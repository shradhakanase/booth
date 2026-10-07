import { NextResponse } from 'next/server';
import { electionFetch, electionForYear, fetchAcVotes } from '@/lib/electionapi';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const election = electionForYear(searchParams.get('year'));
    const district = searchParams.get('district') || '';
    const acName = searchParams.get('ac') || searchParams.get('assemblyConstituency') || '';
    const json = await electionFetch('/api/acs');
    const rows = (json.rows || []).filter((row) =>
      (!election || row.election === election) &&
      (!district || row.district?.toLowerCase() === district.toLowerCase()) &&
      (!acName || row.ac_name?.toLowerCase().includes(acName.toLowerCase()) || String(row.ac) === acName)
    );

    if (!acName) return NextResponse.json({ success: true, data: rows });

    const row = rows[0];
    const votes = row ? await fetchAcVotes(row.ac, row.election).catch(() => null) : null;
    return NextResponse.json({ success: true, data: {
      constituency: row || null,
      performance: {},
      candidates: (votes?.parties || []).map((party) => ({ candidate: party.party, party: party.party, votes: party.votes })),
    }});
  } catch (error) {
    console.error('API Error in /api/analytics/constituency:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 502 });
  }
}
