import { NextResponse } from 'next/server';
import { electionFetch, electionForYear, fetchAcVotes } from '@/lib/electionapi';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const election = electionForYear(searchParams.get('year'));
    const district = searchParams.get('district') || '';
    const ac = searchParams.get('ac') || '';
    const name = (searchParams.get('name') || '').toLowerCase();
    const json = await electionFetch('/api/acs');
    const rows = (json.rows || []).filter((row) =>
      (!election || row.election === election) &&
      (!district || row.district?.toLowerCase() === district.toLowerCase()) &&
      (!ac || String(row.ac) === ac || row.ac_name?.toLowerCase().includes(ac.toLowerCase()))
    );
    const totals = new Map();
    await Promise.all(rows.map(async (row) => {
      const result = await fetchAcVotes(row.ac, row.election).catch(() => null);
      for (const party of result?.parties || []) {
        if (name && !party.party?.toLowerCase().includes(name)) continue;
        const item = totals.get(party.party) || { candidateName: party.party, party: party.party, totalVotes: 0, boothsWon: 0, totalBoothsContested: 0 };
        item.totalVotes += Number(party.votes || 0);
        item.totalBoothsContested += Number(row.booths || 0);
        totals.set(party.party, item);
      }
    }));
    const data = [...totals.values()].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 50);
    return NextResponse.json({ success: true, data, count: data.length });
  } catch (error) {
    console.error('API Error in /api/analytics/candidate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
