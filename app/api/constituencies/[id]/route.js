// import { NextResponse } from 'next/server';
// import connectToDatabase from '@/lib/mongodb.js';
// import { Constituency, Booth, Candidate } from '@/lib/models/index.js';

// export async function GET(request, { params }) {
//   try {
//     await connectToDatabase();
//     const id = decodeURIComponent(params.id);

//     let query = {};
//     if (!isNaN(Number(id))) {
//       query.acNo = Number(id);
//     } else {
//       query.acName = { $regex: new RegExp(`^${id}$`, 'i') };
//     }

//     const constituency = await Constituency.findOne(query).lean();
//     if (!constituency) {
//       return NextResponse.json({ success: false, error: 'Constituency not found' }, { status: 404 });
//     }

//     const [boothsSample, candidateStats] = await Promise.all([
//       Booth.find({
//         $or: [
//           { acNo: constituency.acNo },
//           { assemblyConstituency: constituency.acName },
//         ],
//       })
//         .limit(100)
//         .lean(),
//       Candidate.find({
//         $or: [
//           { acNo: constituency.acNo },
//           { assemblyConstituency: constituency.acName },
//         ],
//       })
//         .sort({ totalVotes: -1 })
//         .lean(),
//     ]);

//     return NextResponse.json({
//       success: true,
//       data: {
//         ...constituency,
//         boothsSample,
//         candidateStats,
//       },
//     });
//   } catch (error) {
//     console.error('API Error in /api/constituencies/[id]:', error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { electionFetch } from '@/lib/electionapi';
import { ELECTIONS } from '@/lib/elections';

export const dynamic = 'force-dynamic';

const ORDER = ['VS2017', 'LS2019', 'VS2022', 'LS2024'];

export async function GET(request, { params }) {
  try {
    const { id: rawId } = await params; // works on Next 14 and 15
    const id = decodeURIComponent(rawId);
    const { searchParams } = new URL(request.url);
    const wanted = ELECTIONS[searchParams.get('year')];

    // 1. Find the constituency by number or by name
    const json = await electionFetch('/api/acs');
    const isNumber = !isNaN(Number(id));
    const matches = json.rows.filter((r) =>
      isNumber ? r.ac === Number(id) : r.ac_name?.toLowerCase() === id.toLowerCase()
    );
    if (matches.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Constituency not found' },
        { status: 404 }
      );
    }

    // 2. Pick the election: the requested year, otherwise the latest available
    const row = wanted
      ? matches.find((r) => r.election === wanted)
      : [...matches].sort((a, b) => ORDER.indexOf(b.election) - ORDER.indexOf(a.election))[0];
    if (!row) {
      return NextResponse.json(
        { success: false, error: 'No data for that year' },
        { status: 404 }
      );
    }

    // 3. Booths and party totals for this constituency (in parallel)
    const [booths, votes] = await Promise.all([
      electionFetch(`/api/booths?ac=${row.ac}&page_size=100`).catch(() => null),
      electionFetch(`/api/ac/${row.ac}/votes?election=${row.election}`).catch(() => null),
    ]);

    const boothsSample = (booths?.rows || []).map((b) => ({
      _id: `${b.ac}-${b.ps}`,
      boothNumber: b.ps,
      pollingStation: b.name,
      district: b.district,
      zone: b.zone,
      latestDiff: b.latest_diff,
      avgDiff: b.avg_diff,
      partyB: b.party_b,
    }));

    // The API has party totals, not candidate names
    const candidateStats = (votes?.parties || []).map((p) => ({
      _id: p.party,
      candidateName: p.party,
      party: p.party,
      totalVotes: p.votes,
    }));

    return NextResponse.json({
      success: true,
      data: {
        _id: `${row.ac}-${row.election}`,
        acNo: row.ac,
        acName: row.ac_name,
        district: row.district,
        election: row.election,
        year: Number(row.election.slice(2)),
        totalBooths: row.booths,
        electors: row.electors,
        totalVotes: row.polled,
        validVotes: row.valid,
        nota: row.nota,
        turnoutPct: row.turnout_pct,
        boothsSample,
        candidateStats,
      },
    });
  } catch (error) {
    console.error('API Error in /api/constituencies/[id]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}