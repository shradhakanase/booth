// import { NextResponse } from 'next/server';
// import connectToDatabase from '@/lib/mongodb.js';
// import { Booth } from '@/lib/models/index.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     await connectToDatabase();
//     const { searchParams } = new URL(request.url);
//     const yearParam = searchParams.get('year');
//     const district = searchParams.get('district');
//     const ac = searchParams.get('ac') || searchParams.get('assemblyConstituency');

//     const match = {};
//     if (yearParam) match.year = Number(yearParam);
//     if (district) match.district = { $regex: new RegExp(`^${district}$`, 'i') };
//     if (ac) match.assemblyConstituency = { $regex: new RegExp(ac, 'i') };

//     const [performanceDistribution, partyDistribution, topBooths, lowestTurnoutBooths] = await Promise.all([
//       Booth.aggregate([
//         { $match: match },
//         {
//           $group: {
//             _id: '$performanceCategory',
//             count: { $sum: 1 },
//             avgMargin: { $avg: '$winningMargin' },
//             totalVotes: { $sum: '$totalVotes' },
//           },
//         },
//       ]),
//       Booth.aggregate([
//         { $match: match },
//         {
//           $group: {
//             _id: '$winner.party',
//             boothsWon: { $sum: 1 },
//             totalVotes: { $sum: '$winner.votes' },
//           },
//         },
//         { $sort: { boothsWon: -1 } },
//       ]),
//       Booth.find(match).sort({ totalVotes: -1 }).limit(10).lean(),
//       Booth.find({ ...match, totalVotes: { $gt: 0 } }).sort({ totalVotes: 1 }).limit(10).lean(),
//     ]);

//     return NextResponse.json({
//       success: true,
//       data: {
//         performanceDistribution,
//         partyDistribution,
//         topBooths,
//         lowestTurnoutBooths,
//       },
//     });
//   } catch (error) {
//     console.error('API Error in /api/analytics/booth:', error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }
import { NextResponse } from 'next/server';
import { electionFetch, fetchAcVotes } from '@/lib/electionapi';
import { ELECTIONS } from '@/lib/elections';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const election = ELECTIONS[year];
    if (!election) {
      return NextResponse.json({ success: false, error: 'Unknown year' }, { status: 400 });
    }
    const district = (searchParams.get('district') || '').toLowerCase();
    const acParam = (
      searchParams.get('ac') || searchParams.get('assemblyConstituency') || ''
    ).toLowerCase();
    const scoped = Boolean(district || acParam);

    // 1. Constituencies in scope for this election
    const acs = await electionFetch('/api/acs');
    const rows = acs.rows.filter(
      (r) =>
        r.election === election &&
        (!district || r.district?.toLowerCase() === district) &&
        (!acParam || r.ac_name?.toLowerCase().includes(acParam) || String(r.ac) === acParam)
    );
    const acSet = new Set(rows.map((r) => r.ac));
    const acInfo = new Map(rows.map((r) => [r.ac, r]));

    // 2. Booth zones (replaces strong / medium / weak)
    const zoneMap = new Map();
    for (const z of acs.zones || []) {
      if (!acSet.has(z.ac)) continue;
      zoneMap.set(z.zone, (zoneMap.get(z.zone) || 0) + z.n);
    }
    const performanceDistribution = [...zoneMap].map(([zone, count]) => ({ _id: zone, count }));

    // 3. Parties: constituencies won and votes (replaces "booths won")
    let partyDistribution = [];
    if (scoped) {
      const pasts = await Promise.all(
        [...acSet].map((ac) => fetchAcVotes(ac, election).catch(() => null))
      );
      const totals = new Map();
      for (const p of pasts) {
        const sheet = p;
        if (!sheet) continue;
        for (const party of sheet.parties || []) {
          const t = totals.get(party.party) || { _id: party.party, seatsWon: 0, totalVotes: 0 };
          t.totalVotes += party.votes;
          totals.set(party.party, t);
        }
        if (sheet.winner && totals.has(sheet.winner)) totals.get(sheet.winner).seatsWon += 1;
      }
      partyDistribution = [...totals.values()].sort(
        (a, b) => b.seatsWon - a.seatsWon || b.totalVotes - a.totalVotes
      );
    } else {
      const trend = await electionFetch('/api/trend');
      const t = trend.rows.find((r) => r.election === election);
      partyDistribution = (t?.top || []).map((p) => ({
        _id: p.party,
        seatsWon: p.seats,
        totalVotes: null,
      }));
    }

    // 4. Booth lists: the API needs a constituency for booth queries, so only when scoped
    let topBooths = [];
    let lowestTurnoutBooths = [];
    if (scoped && acSet.size) {
      const tCol = `t${year}`;   // total votes in that election (assumed column name)
      const toCol = `to${year}`; // turnout fraction (assumed column name)

      const fetchBooths = (ac, order) =>
        electionFetch(
          `/api/booths?ac=${ac}&sort=${tCol}&order=${order}&page_size=${order === 'asc' ? 50 : 10}`
        ).catch(() => null);

      const [descs, ascs] = await Promise.all([
        Promise.all([...acSet].map((ac) => fetchBooths(ac, 'desc'))),
        Promise.all([...acSet].map((ac) => fetchBooths(ac, 'asc'))),
      ]);

      const toBooth = (b) => ({
        _id: `${b.ac}-${b.ps}`,
        boothNumber: b.ps,
        pollingStation: b.name,
        district: b.district,
        assemblyConstituency: acInfo.get(b.ac)?.ac_name,
        totalVotes: b[tCol],
        turnoutPct: b[toCol] != null ? Number((b[toCol] * 100).toFixed(2)) : null,
        zone: b.zone,
      });

      topBooths = descs
        .flatMap((r) => r?.rows || [])
        .filter((b) => b[tCol] > 0)
        .sort((a, b) => b[tCol] - a[tCol])
        .slice(0, 10)
        .map(toBooth);

      lowestTurnoutBooths = ascs
        .flatMap((r) => r?.rows || [])
        .filter((b) => b[tCol] > 0) // skip suppressed or empty booths
        .sort((a, b) => a[tCol] - b[tCol])
        .slice(0, 10)
        .map(toBooth);
    }

    return NextResponse.json({
      success: true,
      data: {
        performanceDistribution,
        partyDistribution,
        topBooths,
        lowestTurnoutBooths,
        ...(scoped ? {} : { note: 'Booth lists need a district or constituency filter' }),
      },
    });
  } catch (error) {
    console.error('API Error in /api/analytics/booth:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
