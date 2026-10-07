// import { NextResponse } from 'next/server';
// import connectToDatabase from '@/lib/mongodb.js';
// import { District } from '@/lib/models/index.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     await connectToDatabase();
//     const { searchParams } = new URL(request.url);
//     const yearParam = searchParams.get('year');
//     const search = searchParams.get('search') || '';
//     const sortBy = searchParams.get('sortBy') || 'totalVotes';
//     const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

//     const query = {};
//     if (yearParam) {
//       query.year = Number(yearParam);
//     }
//     if (search) {
//       query.districtName = { $regex: search, $options: 'i' };
//     }

//     const districts = await District.find(query)
//       .sort({ [sortBy]: sortOrder })
//       .lean();

//     return NextResponse.json({
//       success: true,
//       count: districts.length,
//       data: districts,
//     });
//   } catch (error) {
//     console.error('API Error in /api/districts:', error);
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
    const search = (searchParams.get('search') || '').toLowerCase();
    const sortBy = searchParams.get('sortBy') || 'totalVotes';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const election = ELECTIONS[yearParam];

    // 1. Get all constituency rows from the election API
    const json = await electionFetch('/api/acs');

    // 2. Sum constituency rows into one entry per district
    const byDistrict = new Map();
    for (const r of json.rows) {
      if (election && r.election !== election) continue;
      if (!r.district) continue;

      let d = byDistrict.get(r.district);
      if (!d) {
        d = {
          _id: r.district,
          districtName: r.district,
          year: Number(yearParam) || null,
          totalConstituencies: 0,
          totalBooths: 0,
          totalVotes: 0,
          totalElectors: 0,
        };
        byDistrict.set(r.district, d);
      }
      d.totalConstituencies += 1;
      d.totalBooths += r.booths || 0;
      d.totalVotes += r.polled || 0;
      d.totalElectors += r.electors || 0;
    }

    let data = [...byDistrict.values()].map((d) => ({
      ...d,
      avgVotesPerBooth: d.totalBooths ? Math.round(d.totalVotes / d.totalBooths) : 0,
    }));

    // 3. Search
    if (search) {
      data = data.filter((d) => d.districtName.toLowerCase().includes(search));
    }

    // 4. Sort
    data.sort((a, b) => {
      const x = a[sortBy];
      const y = b[sortBy];
      if (typeof x === 'string') return x.localeCompare(y) * sortOrder;
      return ((x ?? 0) - (y ?? 0)) * sortOrder;
    });

    return NextResponse.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('API Error in /api/districts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}