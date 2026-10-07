// import { NextResponse } from 'next/server';
// import connectToDatabase from '@/lib/mongodb.js';
// import { Constituency } from '@/lib/models/index.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     await connectToDatabase();
//     const { searchParams } = new URL(request.url);
//     const yearParam = searchParams.get('year');
//     const district = searchParams.get('district') || '';
//     const search = searchParams.get('search') || '';
//     const sortBy = searchParams.get('sortBy') || 'totalVotes';
//     const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

//     const query = {};
//     if (yearParam) {
//       query.year = Number(yearParam);
//     }
//     if (district) {
//       query.district = { $regex: new RegExp(`^${district}$`, 'i') };
//     }
//     if (search) {
//       query.$or = [
//         { acName: { $regex: search, $options: 'i' } },
//         { district: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const constituencies = await Constituency.find(query)
//       .sort({ [sortBy]: sortOrder })
//       .lean();

//     return NextResponse.json({
//       success: true,
//       count: constituencies.length,
//       data: constituencies,
//     });
//   } catch (error) {
//     console.error('API Error in /api/constituencies:', error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { electionFetch } from '@/lib/electionapi';
import { ELECTIONS } from '@/lib/elections';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const district = (searchParams.get('district') || '').toLowerCase();
    const search = (searchParams.get('search') || '').toLowerCase();
    const sortBy = searchParams.get('sortBy') || 'totalVotes';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const election = ELECTIONS[yearParam];

    // 1. One row per constituency per election
    const json = await electionFetch('/api/acs');

    // 2. Map to the field names your pages already use
    let data = json.rows
      .filter((r) => !election || r.election === election)
      .map((r) => ({
        _id: `${r.ac}-${r.election}`,
        acNo: r.ac,
        acName: r.ac_name,
        district: r.district,
        election: r.election,
        year: Number(r.election.slice(2)),
        totalBooths: r.booths,
        electors: r.electors,
        totalVotes: r.polled,
        validVotes: r.valid,
        nota: r.nota,
        turnoutPct: r.turnout_pct,
      }));

    // 3. Filters
    if (district) {
      data = data.filter((d) => d.district?.toLowerCase() === district);
    }
    if (search) {
      data = data.filter(
        (d) =>
          d.acName?.toLowerCase().includes(search) ||
          d.district?.toLowerCase().includes(search)
      );
    }

    // 4. Sort (null values go last)
    data.sort((a, b) => {
      const x = a[sortBy];
      const y = b[sortBy];
      if (x == null && y == null) return 0;
      if (x == null) return 1;
      if (y == null) return -1;
      if (typeof x === 'string') return x.localeCompare(y) * sortOrder;
      return (x - y) * sortOrder;
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('API Error in /api/constituencies:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}