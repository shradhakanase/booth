// import { NextResponse } from 'next/server';
// import connectToDatabase from '@/lib/mongodb.js';
// import { Booth } from '@/lib/models/index.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     await connectToDatabase();
//     const { searchParams } = new URL(request.url);

//     const yearParam = searchParams.get('year');
//     const district = searchParams.get('district') || '';
//     const assemblyConstituency = searchParams.get('assemblyConstituency') || searchParams.get('ac') || '';
//     const performanceCategory = searchParams.get('performanceCategory') || searchParams.get('category') || '';
//     const candidate = searchParams.get('candidate') || '';
//     const party = searchParams.get('party') || '';
//     const boothNumber = searchParams.get('boothNumber');
//     const search = searchParams.get('search') || '';

//     const page = parseInt(searchParams.get('page') || '1', 10);
//     const limit = parseInt(searchParams.get('limit') || '50', 10);
//     const skip = (page - 1) * limit;

//     const sortBy = searchParams.get('sortBy') || 'boothNumber';
//     const sortOrder = searchParams.get('sortOrder') === 'desc' ? -1 : 1;

//     const query = {};

//     if (yearParam) {
//       query.year = Number(yearParam);
//     }
//     if (district) {
//       query.district = { $regex: new RegExp(`^${district}$`, 'i') };
//     }
//     if (assemblyConstituency) {
//       query.assemblyConstituency = { $regex: new RegExp(assemblyConstituency, 'i') };
//     }
//     if (performanceCategory && performanceCategory !== 'all') {
//       query.performanceCategory = performanceCategory;
//     }
//     if (candidate) {
//       query['candidateVotes.candidate'] = { $regex: new RegExp(candidate, 'i') };
//     }
//     if (party) {
//       query['winner.party'] = party;
//     }
//     if (boothNumber && !isNaN(Number(boothNumber))) {
//       query.boothNumber = Number(boothNumber);
//     }
//     if (search) {
//       const searchNum = Number(search);
//       if (!isNaN(searchNum)) {
//         query.$or = [
//           { boothNumber: searchNum },
//           { pollingStation: { $regex: search, $options: 'i' } },
//           { district: { $regex: search, $options: 'i' } },
//           { assemblyConstituency: { $regex: search, $options: 'i' } },
//           { 'winner.candidate': { $regex: search, $options: 'i' } },
//         ];
//       } else {
//         query.$or = [
//           { pollingStation: { $regex: search, $options: 'i' } },
//           { district: { $regex: search, $options: 'i' } },
//           { assemblyConstituency: { $regex: search, $options: 'i' } },
//           { 'winner.candidate': { $regex: search, $options: 'i' } },
//         ];
//       }
//     }

//     const [total, booths] = await Promise.all([
//       Booth.countDocuments(query),
//       Booth.find(query)
//         .sort({ [sortBy]: sortOrder })
//         .skip(skip)
//         .limit(limit)
//         .lean(),
//     ]);

//     return NextResponse.json({
//       success: true,
//       data: booths,
//       pagination: {
//         total,
//         page,
//         limit,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (error) {
//     console.error('API Error in /api/booths:', error);
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

    const year = searchParams.get('year');
    const election = ELECTIONS[year];

    if (!election) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unknown year',
        },
        { status: 400 }
      );
    }

    const district = (
      searchParams.get('district') || ''
    ).trim();

    const acParam = (
      searchParams.get('assemblyConstituency') ||
      searchParams.get('ac') ||
      ''
    ).trim();

    let zone =
      searchParams.get('performanceCategory') ||
      searchParams.get('category') ||
      '';

    if (zone === 'all') {
      zone = '';
    }

    const search = (
      searchParams.get('search') || ''
    ).trim();

    const candidate = (
      searchParams.get('candidate') || ''
    ).trim();

    const party = (
      searchParams.get('party') || ''
    ).trim();

    const page = Math.max(
      parseInt(
        searchParams.get('page') || '1',
        10
      ),
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(
          searchParams.get('limit') || '50',
          10
        ),
        1
      ),
      500
    );

    // --------------------------------------------------
    // Sort mapping
    // --------------------------------------------------

    const totalKey = `t${year}`;

    const SORT_MAP = {
      boothNumber: 'ps',
      district: 'district',
      assemblyConstituency: 'ac',
      totalVotes: totalKey,
      performanceCategory: 'zone',
    };

    const sortKey =
      SORT_MAP[
        searchParams.get('sortBy')
      ] || 'ps';

    const order =
      searchParams.get('sortOrder') === 'desc'
        ? 'desc'
        : 'asc';

    // --------------------------------------------------
    // 1. Get AC metadata
    // --------------------------------------------------

    const acResponse =
      await electionFetch('/api/acs');

    const acRows =
      acResponse.rows || [];

    const acNames = new Map();

    for (const row of acRows) {
      const ac = Number(row.ac);

      if (!Number.isInteger(ac)) {
        continue;
      }

      const current = acNames.get(ac);

      if (
        !current ||
        !current.name
      ) {
        acNames.set(ac, {
          name: row.ac_name,
          district: row.district,
        });
      }
    }

    // --------------------------------------------------
    // 2. Resolve selected AC
    // --------------------------------------------------

    let acList = null;

    if (acParam || district) {
      const acNumber = Number(acParam);

      acList = [...acNames]
        .filter(([ac, info]) => {
          const districtMatch =
            !district ||
            String(info.district || '')
              .toLowerCase() ===
              district.toLowerCase();

          const acMatch =
            !acParam ||
            (
              Number.isInteger(acNumber) &&
              ac === acNumber
            ) ||
            String(info.name || '')
              .toLowerCase() ===
              acParam.toLowerCase();

          return districtMatch && acMatch;
        })
        .map(([ac]) => ac);
    }

    // --------------------------------------------------
    // 3. Do not make unscoped API request
    // --------------------------------------------------

    if (
      acList === null &&
      !search
    ) {
      return NextResponse.json({
        success: true,
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 1,
        },
        message:
          'Select a district or constituency, or type a search.',
      });
    }

    // --------------------------------------------------
    // 4. Build API query
    // --------------------------------------------------

    const buildQuery = (extra = {}) => {
      const params =
        new URLSearchParams();

      params.set('sort', sortKey);
      params.set('order', order);

      for (
        const [key, value] of
        Object.entries(extra)
      ) {
        params.set(
          key,
          String(value)
        );
      }

      if (zone) {
        params.set('zone', zone);
      }

      if (party) {
        params.set('party', party);
      }

      if (search) {
        params.set('q', search);
      }

      return params.toString();
    };

    // --------------------------------------------------
    // 5. Fetch booth list
    // --------------------------------------------------

    let rows = [];
    let total = 0;

    if (
      acList === null ||
      acList.length === 1
    ) {
      const ac =
        acList?.[0];

      const query =
        buildQuery({
          ...(ac
            ? { ac }
            : {}),
          page,
          page_size: limit,
        });

      const response =
        await electionFetch(
          `/api/booths?${query}`
        );

      rows =
        response.rows || [];

      total =
        Number(response.total || 0);
    } else if (
      acList.length > 1
    ) {
      // ------------------------------------------------
      // District → multiple ACs
      // ------------------------------------------------

      const results =
        await Promise.all(
          acList.map(
            async (ac) => {
              try {
                return await electionFetch(
                  `/api/booths?${buildQuery(
                    {
                      ac,
                      page: 1,
                      page_size: 500,
                    }
                  )}`
                );
              } catch (error) {
                console.error(
                  `Failed to fetch AC ${ac}:`,
                  error.message
                );

                return null;
              }
            }
          )
        );

      const merged =
        results.flatMap(
          (response) =>
            response?.rows || []
        );

      const direction =
        order === 'desc'
          ? -1
          : 1;

      merged.sort(
        (a, b) => {
          const x =
            a[sortKey];

          const y =
            b[sortKey];

          if (
            x == null &&
            y == null
          ) {
            return 0;
          }

          if (x == null) {
            return 1;
          }

          if (y == null) {
            return -1;
          }

          if (
            typeof x === 'number' &&
            typeof y === 'number'
          ) {
            return (
              (x - y) *
              direction
            );
          }

          return (
            String(x).localeCompare(
              String(y),
              undefined,
              {
                numeric: true,
              }
            ) * direction
          );
        }
      );

      total =
        merged.length;

      rows =
        merged.slice(
          (page - 1) * limit,
          page * limit
        );
    }

    // --------------------------------------------------
    // 6. Map API booth rows
    // --------------------------------------------------

    let data = rows.map(
      (booth) => {
        const ac =
          Number(booth.ac);

        const acInfo =
          acNames.get(ac);

        return {
          _id: `${ac}-${booth.ps}`,

          ac,

          ps: booth.ps,

          boothNumber:
            booth.ps,

          pollingStation:
            booth.name,

          district:
            booth.district ||
            acInfo?.district ||
            '',

          assemblyConstituency:
            acInfo?.name ||
            booth.ac_name ||
            '',

          totalVotes:
            booth[totalKey] ??
            null,

          zone:
            booth.zone ??
            null,

          performanceCategory:
            booth.zone ??
            null,

          partyB:
            booth.party_b ??
            null,

          latestDiffPct:
            booth.latest_diff != null
              ? Number(
                  (
                    booth.latest_diff *
                    100
                  ).toFixed(1)
                )
              : null,

          // These are filled below from booth detail.
          validVotes: null,
          nota: null,
          winningMargin: null,
          winner: null,
          candidateVotes: [],
          sourceFile: null,
          sourceRow: null,
        };
      }
    );

    // --------------------------------------------------
    // 7. Candidate filter
    //
    // Booth list API doesn't necessarily expose
    // candidate names, so fetch booth detail when
    // candidate filtering / modal information is needed.
    // --------------------------------------------------

    const needsDetails =
      Boolean(candidate) ||
      data.length > 0;

    if (needsDetails) {
      const detailResults =
        await Promise.all(
          data.map(
            async (booth) => {
              try {
                const detail =
                  await electionFetch(
                    `/api/booth/${booth.ac}/${booth.ps}`
                  );

                return {
                  boothId:
                    booth._id,
                  detail,
                };
              } catch (error) {
                console.error(
                  `Failed to fetch booth detail ${booth.ac}/${booth.ps}:`,
                  error.message
                );

                return {
                  boothId:
                    booth._id,
                  detail: null,
                };
              }
            }
          )
        );

      const detailsMap =
        new Map(
          detailResults.map(
            (item) => [
              item.boothId,
              item.detail,
            ]
          )
        );

      data = data
        .map((booth) => {
          const detail =
            detailsMap.get(
              booth._id
            );

          if (!detail) {
            return booth;
          }

          const candidates =
            detail.votes?.[election] ||
            [];

          // ------------------------------------------
          // Candidate vote share
          // ------------------------------------------

          const totalCandidateVotes =
            candidates.reduce(
              (sum, c) =>
                sum +
                Number(
                  c.votes || 0
                ),
              0
            );

          const candidateVotes =
            candidates.map(
              (c) => ({
                candidate:
                  c.candidate ??
                  c.candidate_name ??
                  c.name ??
                  '',
                party:
                  c.party ??
                  c.party_name ??
                  '',
                votes:
                  Number(
                    c.votes || 0
                  ),
                voteShare:
                  totalCandidateVotes >
                  0
                    ? Number(
                        (
                          (Number(
                            c.votes || 0
                          ) /
                            totalCandidateVotes) *
                          100
                        ).toFixed(2)
                      )
                    : 0,
              })
            );

          // ------------------------------------------
          // Booth winner
          // ------------------------------------------

          const sortedCandidates =
            [...candidateVotes].sort(
              (a, b) =>
                b.votes -
                a.votes
            );

          const winner =
            sortedCandidates[0] ||
            null;

          const runnerUp =
            sortedCandidates[1] ||
            null;

          const winningMargin =
            winner
              ? winner.votes -
                Number(
                  runnerUp?.votes ||
                    0
                )
              : 0;

          // ------------------------------------------
          // Metadata from booth detail
          // ------------------------------------------

          return {
            ...booth,

            validVotes:
              detail.summary?.[election]
                ?.valid ??
              detail.valid ??
              null,

            nota:
              detail.summary?.[election]
                ?.nota ??
              detail.nota ??
              0,

            winner,

            winningMargin,

            candidateVotes,

            sourceFile:
              detail.source_file ??
              detail.sourceFile ??
              null,

            sourceRow:
              detail.source_row ??
              detail.sourceRow ??
              null,
          };
        });

      // ----------------------------------------------
      // Candidate filter
      // ----------------------------------------------

      if (candidate) {
        const q =
          candidate.toLowerCase();

        data = data.filter(
          (booth) =>
            booth.candidateVotes?.some(
              (c) =>
                c.candidate
                  ?.toLowerCase()
                  .includes(q)
            )
        );
      }
    }

    // --------------------------------------------------
    // 8. Return response
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      data,

      pagination: {
        total,
        page,
        limit,
        totalPages:
          Math.max(
            Math.ceil(
              total / limit
            ),
            1
          ),
      },

      election,

      year: Number(year),

      filters: {
        district,
        ac: acParam,
        zone,
        candidate,
        party,
        search,
      },
    });
  } catch (error) {
    console.error(
      'API Error in /api/booths:',
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