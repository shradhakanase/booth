// The upstream API calls this variable NEXT_PUBLIC_UPBI_API.  Keep the old
// names as a backwards-compatible fallback for existing local deployments.
const API = (process.env.UPBI_API_URL || process.env.NEXT_PUBLIC_UPBI_API || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const KEY = process.env.UPBI_API_KEY || process.env.API_KEY; // server-side only

export async function electionFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(KEY ? { 'x-api-key': KEY } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) throw new Error('Election API: invalid or missing API key');
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Election API error ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`);
  }
  return res.json();
}

export const electionForYear = (year) => ({
  2017: 'VS2017',
  2019: 'LS2019',
  2022: 'VS2022',
  2024: 'LS2024',
}[Number(year)]);

export const fetchAcs = () => electionFetch('/api/acs');

export const fetchAcVotes = (ac, election) =>
  electionFetch(`/api/ac/${encodeURIComponent(ac)}/votes?election=${encodeURIComponent(election)}`);
