import { NextResponse } from 'next/server';
import { electionFetch, electionForYear, fetchAcVotes } from '@/lib/electionapi';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const election = electionForYear(searchParams.get('year'));
    const district = searchParams.get('district') || '';
    const json = await electionFetch('/api/acs');
    const rows = (json.rows || []).filter((row) =>
      (!election || row.election === election) &&
      (!district || row.district?.toLowerCase() === district.toLowerCase())
    );

    const data = rows.reduce((result, row) => {
      const item = result.get(row.district) || {
        districtName: row.district, totalConstituencies: 0, totalBooths: 0,
        totalVotes: 0, totalElectors: 0, totalValidVotes: 0,
      };
      item.totalConstituencies += 1;
      item.totalBooths += Number(row.booths || 0);
      item.totalVotes += Number(row.polled || 0);
      item.totalElectors += Number(row.electors || 0);
      item.totalValidVotes += Number(row.valid || 0);
      result.set(row.district, item);
      return result;
    }, new Map());

    const list = [...data.values()].map((item) => ({
      ...item,
      avgTurnout: item.totalElectors ? Number((item.totalVotes / item.totalElectors * 100).toFixed(2)) : 0,
    }));

    if (!district) return NextResponse.json({ success: true, data: list });

    const parties = new Map();
    await Promise.all(rows.map(async (row) => {
      const votes = await fetchAcVotes(row.ac, row.election).catch(() => null);
      for (const party of votes?.parties || []) {
        const item = parties.get(party.party) || { party: party.party, boothsWon: 0, votes: 0 };
        item.votes += Number(party.votes || 0);
        parties.set(party.party, item);
      }
    }));

    return NextResponse.json({ success: true, data: {
      district: list[0],
      partyBreakdown: [...parties.values()].sort((a, b) => b.votes - a.votes),
      candidateBreakdown: [],
    }});
  } catch (error) {
    console.error('API Error in /api/analytics/district:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
