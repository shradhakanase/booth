// import { NextResponse } from 'next/server';
// import connectToDatabase from '@/lib/mongodb.js';
// import { District, Constituency, Candidate, Booth, SourceFile } from '@/lib/models/index.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request, { params }) {
//   try {
//     await connectToDatabase();
//     const { searchParams } = new URL(request.url);
//     const yearParam = searchParams.get('year');
//     const districtName = decodeURIComponent(params.district);

//     const yearFilter = yearParam ? { year: Number(yearParam) } : {};
//     const districtRegex = { $regex: new RegExp(`^${districtName}$`, 'i') };

//     const district = await District.findOne({
//       districtName: districtRegex,
//       ...yearFilter,
//     }).lean();

//     if (!district) {
//       return NextResponse.json({ success: false, error: 'District not found' }, { status: 404 });
//     }

//     const [constituencies, topCandidates, filesCount, boothCategories] = await Promise.all([
//       Constituency.find({ district: districtRegex, ...yearFilter }).lean(),
//       Candidate.find({ district: districtRegex, ...yearFilter })
//         .sort({ totalVotes: -1 })
//         .limit(10)
//         .lean(),
//       SourceFile.countDocuments({ district: districtRegex, ...yearFilter }),
//       Booth.aggregate([
//         { $match: { district: districtRegex, ...yearFilter } },
//         { $group: { _id: '$performanceCategory', count: { $sum: 1 } } }
//       ]),
//     ]);

//     const performance = { strong: 0, medium: 0, weak: 0 };
//     boothCategories.forEach(b => {
//       if (b._id && performance[b._id] !== undefined) {
//         performance[b._id] = b.count;
//       }
//     });

//     return NextResponse.json({
//       success: true,
//       data: {
//         ...district,
//         filesCount,
//         performance,
//         constituencies,
//         topCandidates,
//       },
//     });
//   } catch (error) {
//     console.error(`API Error in /api/districts/[district]:`, error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { electionFetch, fetchAcVotes } from '@/lib/electionapi';
import { ELECTIONS } from '@/lib/elections';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { district } = await params; // works on Next 14 and 15
    const districtName = decodeURIComponent(district);
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const election = ELECTIONS[yearParam];

    // 1. All constituency rows, filtered locally (case-insensitive)
    const json = await electionFetch('/api/acs');
    const rows = json.rows.filter(
      (r) =>
        r.district?.toLowerCase() === districtName.toLowerCase() &&
        (!election || r.election === election)
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: 'District not found' }, { status: 404 });
    }

    // 2. Result sheet for each constituency (parallel)
    const votes = await Promise.all(
      rows.map((r) => fetchAcVotes(r.ac, election).catch(() => null))
    );
    const pastFor = (i) => votes[i];

    // 3. Constituencies (the API has the winning party, not the candidate's name)
    const constituencies = rows.map((r, i) => ({
      _id: `${r.ac}-${r.election}`,
      acNo: r.ac,
      acName: r.ac_name,
      totalBooths: r.booths,
      totalVotes: r.polled,
      winner: { candidate: null, party: pastFor(i)?.winner ?? null },
    }));

    // 4. Party totals across the district, shown where "top candidates" were
    const partyTotals = new Map();
    rows.forEach((_, i) => {
      for (const p of pastFor(i)?.parties || []) {
        partyTotals.set(p.party, (partyTotals.get(p.party) || 0) + p.votes);
      }
    });
    const topCandidates = [...partyTotals]
      .map(([party, votes]) => ({
        _id: party,
        candidateName: party,
        party,
        totalVotes: votes,
      }))
      .sort((a, b) => b.totalVotes - a.totalVotes)
      .slice(0, 10);

    // 5. Booth zones for this district's constituencies
    const acSet = new Set(rows.map((r) => r.ac));
    const zoneMap = new Map();
    for (const z of json.zones || []) {
      if (!acSet.has(z.ac)) continue;
      zoneMap.set(z.zone, (zoneMap.get(z.zone) || 0) + z.n);
    }
    const zones = [...zoneMap].map(([zone, booths]) => ({ zone, booths }));

    const totalBooths = rows.reduce((s, r) => s + (r.booths || 0), 0);
    const totalVotes = rows.reduce((s, r) => s + (r.polled || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        districtName: rows[0].district,
        year: Number(yearParam) || null,
        totalConstituencies: rows.length,
        totalBooths,
        totalVotes,
        avgVotesPerBooth: totalBooths ? Math.round(totalVotes / totalBooths) : 0,
        zones,
        constituencies,
        topCandidates,
      },
    });
  } catch (error) {
    console.error('API Error in /api/districts/[district]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
