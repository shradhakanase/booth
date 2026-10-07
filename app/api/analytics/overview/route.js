// import { NextResponse } from 'next/server';
// import { getOverviewStats } from '@/lib/analytics.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const yearParam = searchParams.get('year');
//     const district = searchParams.get('district') || '';
//     const assemblyConstituency = searchParams.get('assemblyConstituency') || searchParams.get('ac') || '';

//     const filter = {};
//     if (yearParam) filter.year = Number(yearParam);
//     if (district) filter.district = district;
//     if (assemblyConstituency) filter.assemblyConstituency = assemblyConstituency;

//     const stats = await getOverviewStats(filter);

//     return NextResponse.json({
//       success: true,
//       data: stats,
//     });
//   } catch (error) {
//     console.error('API Error in /api/analytics/overview:', error);
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
    const election = ELECTIONS[searchParams.get('year')];
    const district = (searchParams.get('district') || '').toLowerCase();
    const acName = (
      searchParams.get('assemblyConstituency') || searchParams.get('ac') || ''
    ).toLowerCase();

    // 1. One row per constituency per election
    const json = await electionFetch('/api/acs');
    const rows = json.rows.filter(
      (r) =>
        (!election || r.election === election) &&
        (!district || r.district?.toLowerCase() === district) &&
        (!acName || r.ac_name?.toLowerCase() === acName)
    );
    const sum = (k) => rows.reduce((s, r) => s + (r[k] || 0), 0);

    // 2. Top districts by booth count
    const byDistrict = new Map();
    for (const r of rows) {
      const d = byDistrict.get(r.district) || { district: r.district, booths: 0, votes: 0 };
      d.booths += r.booths || 0;
      d.votes += r.polled || 0;
      byDistrict.set(r.district, d);
    }
    const topDistricts = [...byDistrict.values()]
      .sort((a, b) => b.booths - a.booths)
      .slice(0, 10);

    // 3. Booth zones (Safe / Favorable / ...) for the selected constituencies
    const acSet = new Set(rows.map((r) => r.ac));
    const zoneMap = new Map();
    for (const z of json.zones || []) {
      if (!acSet.has(z.ac)) continue;
      zoneMap.set(z.zone, (zoneMap.get(z.zone) || 0) + z.n);
    }
    const zoneDistribution = [...zoneMap].map(([zone, booths]) => ({ zone, booths }));
    const zoneCount = (name) => zoneMap.get(name) || 0;

    // 4. Average turnout
    const electors = sum('electors');
    const polled = sum('polled');

    return NextResponse.json({
      success: true,
      data: {
        totalDistricts: byDistrict.size,
        totalBooths: sum('booths'),
        totalVotes: polled,
        totalValidVotes: sum('valid'),
        totalNota: sum('nota'),
        avgTurnout: electors ? Number(((polled / electors) * 100).toFixed(2)) : 0,
        // Keep the dashboard's legacy KPI shape while exposing the source
        // API's richer zone breakdown alongside it.
        performanceDistribution: {
          strong: zoneCount('Safe'),
          medium: zoneCount('Favorable') + zoneCount('Battlefield'),
          weak: zoneCount('Difficult') + zoneCount('Data Not sufficient'),
        },
        avgWinningMargin: 0,
        totalCandidates: 0,
        topDistricts,
        zoneDistribution,
      },
    });
  } catch (error) {
    console.error('API Error in /api/analytics/overview:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
