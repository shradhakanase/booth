// import { NextResponse } from 'next/server';
// import { getMarginAnalytics } from '@/lib/analytics.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const yearParam = searchParams.get('year');
//     const district = searchParams.get('district');
//     const ac = searchParams.get('assemblyConstituency') || searchParams.get('ac');

//     const filter = {};
//     if (yearParam) filter.year = Number(yearParam);
//     if (district) filter.district = district;
//     if (ac) filter.assemblyConstituency = ac;

//     const data = await getMarginAnalytics(filter);

//     return NextResponse.json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     console.error('API Error in /api/analytics/margins:', error);
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
    if (!election) {
      return NextResponse.json({ success: false, error: 'Unknown year' }, { status: 400 });
    }
    const district = (searchParams.get('district') || '').toLowerCase();
    const acParam = (
      searchParams.get('assemblyConstituency') || searchParams.get('ac') || ''
    ).toLowerCase();

    // 1. AC number -> name and district lookup
    const acs = await electionFetch('/api/acs');
    const info = new Map();
    for (const r of acs.rows) {
      info.set(r.ac, { district: r.district, acName: r.ac_name });
    }

    // 2. Which constituencies are selected (accepts an AC name or number)
    const scoped = district || acParam;
    const targets = scoped
      ? [...info]
          .filter(
            ([ac, v]) =>
              (!district || v.district?.toLowerCase() === district) &&
              (!acParam ||
                v.acName?.toLowerCase() === acParam ||
                String(ac) === acParam)
          )
          .map(([ac]) => ac)
      : [null]; // null = whole state, one call

    // 3. Closest and biggest margins (in parallel)
    const call = (order, ac) =>
      electionFetch(
        `/api/margins?election=${election}&order=${order}&limit=10${ac ? `&ac=${ac}` : ''}`
      );
    const asc = await Promise.all(targets.map((ac) => call('asc', ac)));
    const desc = await Promise.all(targets.map((ac) => call('desc', ac)));

    const toRow = (m) => ({
      district: info.get(m.ac)?.district,
      assemblyConstituency: info.get(m.ac)?.acName,
      boothNumber: m.ps,
      // The API has parties only, not candidate names
      winner: { candidate: null, party: m.winner_party },
      runnerUp: { candidate: null, party: m.runnerup_party },
      winningMargin: m.margin_votes,
    });

    const closestContests = asc
      .flatMap((r) => r.rows || [])
      .sort((a, b) => a.margin_votes - b.margin_votes)
      .slice(0, 10)
      .map(toRow);

    const biggestVictories = desc
      .flatMap((r) => r.rows || [])
      .sort((a, b) => b.margin_votes - a.margin_votes)
      .slice(0, 10)
      .map(toRow);

    // 4. Merge histogram buckets across the selected constituencies
    const buckets = new Map();
    for (const r of asc) {
      for (const h of r.histogram || []) {
        buckets.set(h.under_pp, (buckets.get(h.under_pp) || 0) + h.booths);
      }
    }
    const marginDistribution = [...buckets]
      .sort((a, b) => a[0] - b[0])
      .map(([under, booths]) => ({ range: `<${under} pp`, count: booths }));

    return NextResponse.json({
      success: true,
      data: { marginDistribution, closestContests, biggestVictories },
    });
  } catch (error) {
    console.error('API Error in /api/analytics/margins:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}