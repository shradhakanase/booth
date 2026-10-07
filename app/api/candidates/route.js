// import { NextResponse } from 'next/server';
// import connectToDatabase from '@/lib/mongodb.js';
// import { Candidate } from '@/lib/models/index.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     await connectToDatabase();
//     const { searchParams } = new URL(request.url);

//     const yearParam = searchParams.get('year');
//     const district = searchParams.get('district') || '';
//     const party = searchParams.get('party') || '';
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
//     if (party) {
//       query.party = party;
//     }
//     if (search) {
//       query.$or = [
//         { candidateName: { $regex: search, $options: 'i' } },
//         { party: { $regex: search, $options: 'i' } },
//         { district: { $regex: search, $options: 'i' } },
//         { assemblyConstituency: { $regex: search, $options: 'i' } },
//       ];
//     }

//     const candidates = await Candidate.find(query)
//       .sort({ [sortBy]: sortOrder })
//       .limit(200)
//       .lean();

//     return NextResponse.json({
//       success: true,
//       count: candidates.length,
//       data: candidates,
//     });
//   } catch (error) {
//     console.error('API Error in /api/candidates:', error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }
import { NextResponse } from 'next/server';
import { ELECTIONS } from '@/lib/elections';

export const dynamic = 'force-dynamic';

const API =
  process.env.UPBI_API_URL || process.env.NEXT_PUBLIC_UPBI_API || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const KEY = process.env.UPBI_API_KEY || process.env.API_KEY;

// --------------------------------------------------
// Election API fetch helper
// --------------------------------------------------
async function electionFetch(path) {
  const res = await fetch(`${API}${path}`, {
    method: 'GET',
    headers: {
      ...(KEY ? { 'x-api-key': KEY } : {}),
    },
    cache: 'no-store',
  });

  if (res.status === 401) {
    throw new Error('Election API: invalid or missing API key');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Election API error ${res.status}: ${text}`
    );
  }

  return res.json();
}

// --------------------------------------------------
// Fetch all booths for an AC
// --------------------------------------------------
async function fetchAllBooths(ac) {
  const pageSize = 500;

  let page = 1;
  let allRows = [];
  let total = null;

  while (true) {
    const data = await electionFetch(
      `/api/booths?ac=${encodeURIComponent(
        ac
      )}&page=${page}&page_size=${pageSize}`
    );

    const rows = data.rows || [];

    allRows.push(...rows);

    if (total === null) {
      total = Number(data.total || rows.length);
    }

    if (
      rows.length === 0 ||
      allRows.length >= total ||
      rows.length < pageSize
    ) {
      break;
    }

    page++;
  }

  return allRows;
}

// --------------------------------------------------
// Fetch one booth's candidate results
// --------------------------------------------------
async function fetchBoothCandidates(ac, ps, election) {
  try {
    const data = await electionFetch(
      `/api/booth/${encodeURIComponent(
        ac
      )}/${encodeURIComponent(ps)}`
    );

    const votes = data.votes?.[election];

    if (!Array.isArray(votes)) {
      return [];
    }

    return votes;
  } catch (error) {
    console.error(
      `Failed to fetch booth ${ac}/${ps}:`,
      error.message
    );

    return [];
  }
}

// --------------------------------------------------
// Limit concurrent requests
// --------------------------------------------------
async function mapWithConcurrency(
  items,
  worker,
  concurrency = 10
) {
  const results = [];

  let index = 0;

  async function runWorker() {
    while (true) {
      const currentIndex = index++;

      if (currentIndex >= items.length) {
        return;
      }

      results[currentIndex] = await worker(
        items[currentIndex],
        currentIndex
      );
    }
  }

  const workers = Array.from(
    {
      length: Math.min(concurrency, items.length),
    },
    () => runWorker()
  );

  await Promise.all(workers);

  return results;
}

// --------------------------------------------------
// GET /api/candidates
// --------------------------------------------------
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const yearParam =
      searchParams.get('year') || '2022';

    const district =
      searchParams.get('district') || '';

    const ac =
      searchParams.get('ac') || '';

    const party =
      searchParams.get('party') || '';

    const search =
      searchParams.get('search') || '';

    const sortBy =
      searchParams.get('sortBy') || 'totalVotes';

    const sortOrder =
      searchParams.get('sortOrder') === 'asc'
        ? 'asc'
        : 'desc';

    // ------------------------------------------------
    // Validate election year
    // ------------------------------------------------
    const election = ELECTIONS[Number(yearParam)];

    if (!election) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported election year: ${yearParam}`,
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------
    // Candidate aggregation needs an AC
    // ------------------------------------------------
    if (!ac) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: [],
        message:
          'Please select an Assembly Constituency to view candidate performance.',
      });
    }

    console.log(
      `[Candidates] Loading ${yearParam} / ${election} / AC ${ac}`
    );

    // ------------------------------------------------
    // 1. Get all booths for selected AC
    // ------------------------------------------------
    const booths = await fetchAllBooths(ac);

    console.log(
      `[Candidates] Found ${booths.length} booths`
    );

    // ------------------------------------------------
    // 2. Get candidate votes from each booth
    // ------------------------------------------------
    const boothResults = await mapWithConcurrency(
      booths,
      async (booth) => {
        const ps =
          booth.ps ??
          booth.polling_station ??
          booth.booth ??
          booth.part_no;

        if (!ps) {
          return {
            booth,
            candidates: [],
          };
        }

        const candidates =
          await fetchBoothCandidates(
            ac,
            ps,
            election
          );

        return {
          booth,
          candidates,
        };
      },
      10
    );

    // ------------------------------------------------
    // 3. Aggregate candidates
    // ------------------------------------------------
    const candidateMap = new Map();

    for (const result of boothResults) {
      const booth = result.booth;
      const candidates = result.candidates;

      if (!Array.isArray(candidates)) {
        continue;
      }

      for (const candidate of candidates) {
        const candidateName =
          candidate.candidate ??
          candidate.candidate_name ??
          candidate.name ??
          '';

        const candidateParty =
          candidate.party ??
          candidate.party_name ??
          '';

        const votes = Number(
          candidate.votes ?? 0
        );

        if (!candidateName) {
          continue;
        }

        // Unique candidate key
        const key = `${candidateName}|||${candidateParty}`;

        if (!candidateMap.has(key)) {
          candidateMap.set(key, {
            candidateName,
            party: candidateParty,

            totalVotes: 0,

            boothsWon: 0,
            totalBoothsContested: 0,

            highestVoteBooth: null,
            lowestVoteBooth: null,

            assemblyConstituency:
              booth.ac_name ||
              booth.acName ||
              booth.constituency ||
              `AC ${ac}`,

            district:
              booth.district || district || '',
          });
        }

        const candidateData =
          candidateMap.get(key);

        // Total votes
        candidateData.totalVotes += votes;

        // Candidate contested this booth
        candidateData.totalBoothsContested += 1;

        // ------------------------------------------------
        // Best booth
        // ------------------------------------------------
        if (
          !candidateData.highestVoteBooth ||
          votes >
            candidateData.highestVoteBooth.votes
        ) {
          candidateData.highestVoteBooth = {
            votes,
            boothNumber:
              booth.ps ??
              booth.part_no ??
              booth.name ??
              '—',
          };
        }

        // ------------------------------------------------
        // Lowest booth
        // ------------------------------------------------
        if (
          !candidateData.lowestVoteBooth ||
          votes <
            candidateData.lowestVoteBooth.votes
        ) {
          candidateData.lowestVoteBooth = {
            votes,
            boothNumber:
              booth.ps ??
              booth.part_no ??
              booth.name ??
              '—',
          };
        }
      }
    }

    // ------------------------------------------------
    // 4. Calculate booth winners
    // ------------------------------------------------
    for (const result of boothResults) {
      const candidates = result.candidates;

      if (!Array.isArray(candidates) || !candidates.length) {
        continue;
      }

      let winner = null;

      for (const candidate of candidates) {
        const candidateName =
          candidate.candidate ??
          candidate.candidate_name ??
          candidate.name ??
          '';

        const candidateParty =
          candidate.party ??
          candidate.party_name ??
          '';

        const votes = Number(
          candidate.votes ?? 0
        );

        if (
          !winner ||
          votes > winner.votes
        ) {
          winner = {
            candidateName,
            party: candidateParty,
            votes,
          };
        }
      }

      if (!winner || !winner.candidateName) {
        continue;
      }

      const key = `${winner.candidateName}|||${winner.party}`;

      const candidateData =
        candidateMap.get(key);

      if (candidateData) {
        candidateData.boothsWon += 1;
      }
    }

    // ------------------------------------------------
    // 5. Convert Map → array
    // ------------------------------------------------
    let candidates = Array.from(
      candidateMap.values()
    );

    // ------------------------------------------------
    // 6. Average votes / booth
    // ------------------------------------------------
    candidates = candidates.map(
      (candidate) => ({
        ...candidate,

        avgVotesPerBooth:
          candidate.totalBoothsContested > 0
            ? Number(
                (
                  candidate.totalVotes /
                  candidate.totalBoothsContested
                ).toFixed(2)
              )
            : 0,

        isWinner: false,
      })
    );

    // ------------------------------------------------
    // 7. Determine constituency winner
    // ------------------------------------------------
    if (candidates.length > 0) {
      const winner = [...candidates].sort(
        (a, b) =>
          b.totalVotes - a.totalVotes
      )[0];

      const winnerKey =
        `${winner.candidateName}|||${winner.party}`;

      candidates = candidates.map(
        (candidate) => ({
          ...candidate,
          isWinner:
            `${candidate.candidateName}|||${candidate.party}` ===
            winnerKey,
        })
      );
    }

    // ------------------------------------------------
    // 8. District filter
    // ------------------------------------------------
    if (district) {
      candidates = candidates.filter(
        (candidate) =>
          String(candidate.district)
            .toLowerCase() ===
          String(district).toLowerCase()
      );
    }

    // ------------------------------------------------
    // 9. Party filter
    // ------------------------------------------------
    if (party) {
      candidates = candidates.filter(
        (candidate) =>
          String(candidate.party)
            .toLowerCase() ===
          String(party).toLowerCase()
      );
    }

    // ------------------------------------------------
    // 10. Search
    // ------------------------------------------------
    if (search) {
      const q =
        search.toLowerCase();

      candidates = candidates.filter(
        (candidate) =>
          String(
            candidate.candidateName
          )
            .toLowerCase()
            .includes(q) ||
          String(candidate.party)
            .toLowerCase()
            .includes(q) ||
          String(
            candidate.district
          )
            .toLowerCase()
            .includes(q) ||
          String(
            candidate.assemblyConstituency
          )
            .toLowerCase()
            .includes(q)
      );
    }

    // ------------------------------------------------
    // 11. Sorting
    // ------------------------------------------------
    candidates.sort((a, b) => {
      let valueA = a[sortBy];
      let valueB = b[sortBy];

      // Nested booth fields
      if (
        sortBy === 'highestVoteBooth'
      ) {
        valueA =
          a.highestVoteBooth?.votes ?? 0;
        valueB =
          b.highestVoteBooth?.votes ?? 0;
      }

      if (
        sortBy === 'lowestVoteBooth'
      ) {
        valueA =
          a.lowestVoteBooth?.votes ?? 0;
        valueB =
          b.lowestVoteBooth?.votes ?? 0;
      }

      // Numbers
      if (
        typeof valueA === 'number' ||
        typeof valueB === 'number'
      ) {
        valueA = Number(valueA || 0);
        valueB = Number(valueB || 0);

        return sortOrder === 'asc'
          ? valueA - valueB
          : valueB - valueA;
      }

      // Strings
      return sortOrder === 'asc'
        ? String(valueA || '').localeCompare(
            String(valueB || '')
          )
        : String(valueB || '').localeCompare(
            String(valueA || '')
          );
    });

    // ------------------------------------------------
    // 12. Limit
    // ------------------------------------------------
    candidates = candidates.slice(0, 200);

    return NextResponse.json({
      success: true,
      count: candidates.length,
      data: candidates,
      election: election,
      year: Number(yearParam),
      ac: Number(ac),
    });
  } catch (error) {
    console.error(
      'API Error in /api/candidates:',
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
