// import { NextResponse } from 'next/server';
// import { getMultiYearComparison } from '@/lib/analytics.js';

// export const dynamic = 'force-dynamic';

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const yearsParam = searchParams.get('years');
//     const baseYearParam = searchParams.get('baseYear') || searchParams.get('year1') || '2024';
//     const compareYearParam = searchParams.get('compareYear') || searchParams.get('year2') || '2022';
//     const district = searchParams.get('district') || '';
//     const assemblyConstituency = searchParams.get('assemblyConstituency') || searchParams.get('ac') || '';

//     let years = [2024, 2022, 2019, 2017];
//     if (yearsParam) {
//       years = yearsParam.split(',').map((y) => parseInt(y.trim(), 10)).filter(Boolean);
//     } else {
//       years = Array.from(new Set([parseInt(baseYearParam, 10), parseInt(compareYearParam, 10), ...years])).filter(Boolean);
//     }

//     const data = await getMultiYearComparison({
//       years,
//       baseYear: parseInt(baseYearParam, 10),
//       compareYear: parseInt(compareYearParam, 10),
//       district,
//       assemblyConstituency,
//     });

//     return NextResponse.json({
//       success: true,
//       data,
//     });
//   } catch (error) {
//     console.error('API Error in /api/analytics/compare:', error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }
import { NextResponse } from 'next/server';
import { electionFetch } from '@/lib/electionapi';
import { ELECTIONS } from '@/lib/elections';

export const dynamic = 'force-dynamic';

const round2 = (n) =>
  Number(Number(n || 0).toFixed(2));

export async function GET(request) {
  try {
    const { searchParams } =
      new URL(request.url);

    const baseYear = Number(
      searchParams.get('baseYear') ||
      searchParams.get('year1') ||
      2024
    );

    const compareYear = Number(
      searchParams.get('compareYear') ||
      searchParams.get('year2') ||
      2022
    );

    const yearsParam =
      searchParams.get('years');

    const district =
      searchParams.get('district') || '';

    // --------------------------------------------------
    // Years
    // --------------------------------------------------

    let years;

    if (yearsParam) {
      years = yearsParam
        .split(',')
        .map((y) => Number(y.trim()))
        .filter((y) => ELECTIONS[y]);
    } else {
      years = [
        baseYear,
        compareYear,
      ].filter((y) => ELECTIONS[y]);
    }

    years = [
      ...new Set(years),
    ].sort((a, b) => a - b);

    if (!years.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'No valid election years selected',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 1. Get constituency/AC data
    // --------------------------------------------------

    const acResponse =
      await electionFetch('/api/acs');

    const acRows =
      acResponse.rows || [];

    // --------------------------------------------------
    // Filter district
    // --------------------------------------------------

    const scopedRows = district
      ? acRows.filter(
          (row) =>
            String(row.district || '')
              .toLowerCase() ===
            district.toLowerCase()
        )
      : acRows;

    // --------------------------------------------------
    // 2. Build year statistics
    // --------------------------------------------------

    const yearStatsMap = {};

    for (const year of years) {
      const election =
        ELECTIONS[year];

      const rows =
        scopedRows.filter(
          (row) =>
            row.election === election
        );

      const totalVotes =
        rows.reduce(
          (sum, row) =>
            sum +
            Number(row.polled || 0),
          0
        );

      const totalValidVotes =
        rows.reduce(
          (sum, row) =>
            sum +
            Number(row.valid || 0),
          0
        );

      const totalNota =
        rows.reduce(
          (sum, row) =>
            sum +
            Number(row.nota || 0),
          0
        );

      const totalBooths =
        rows.reduce(
          (sum, row) =>
            sum +
            Number(row.booths || 0),
          0
        );

      const totalElectors =
        rows.reduce(
          (sum, row) =>
            sum +
            Number(row.electors || 0),
          0
        );

      const avgTurnout =
        totalElectors > 0
          ? round2(
              (totalVotes /
                totalElectors) *
                100
            )
          : 0;

      yearStatsMap[year] = {
        year,
        election,

        totalVotes,
        totalValidVotes,
        totalNota,

        totalBooths,

        totalConstituencies:
          rows.length,

        avgTurnout,

        // These are populated below
        avgWinningMargin: 0,

        strongBooths: 0,
        mediumBooths: 0,
        weakBooths: 0,

        strongPct: 0,
        mediumPct: 0,
        weakPct: 0,
      };
    }

    // --------------------------------------------------
    // 3. Party information
    // --------------------------------------------------

    const partyMaps = {};

    for (const year of years) {
      partyMaps[year] =
        new Map();
    }

    // /api/ac/{ac}/past gives party totals
    // for the constituency across elections.
    //
    // For district/statewide this can involve many ACs,
    // so only use it where practical.

    const acNumbers = [
      ...new Set(
        scopedRows
          .map((row) =>
            Number(row.ac)
          )
          .filter(
            (ac) =>
              Number.isInteger(ac)
          )
      ),
    ];

    /*
     * Fetch AC historical party data.
     *
     * We use bounded batches rather than firing every
     * request simultaneously.
     */

    const batchSize = 10;

    for (
      let start = 0;
      start < acNumbers.length;
      start += batchSize
    ) {
      const batch =
        acNumbers.slice(
          start,
          start + batchSize
        );

      const results =
        await Promise.all(
          batch.map(
            async (ac) => {
              try {
                const result = { rows: [] };
                for (const year of years) {
                  const response = await electionFetch(
                    `/api/ac/${ac}/votes?election=${ELECTIONS[year]}`
                  );
                  result.rows.push({ election: ELECTIONS[year], ...response });
                }
                return result;
              } catch (error) {
                console.error(
                  `Compare: failed AC ${ac}`,
                  error.message
                );

                return null;
              }
            }
          )
        );

      for (const result of results) {
        for (
          const year of years
        ) {
          const election =
            ELECTIONS[year];

          const sheet =
            result?.rows?.find(
              (row) =>
                row.election ===
                election
            );

          for (
            const party of
            sheet?.parties || []
          ) {
            const name =
              party.party;

            const votes =
              Number(
                party.votes || 0
              );

            const current =
              partyMaps[
                year
              ].get(name) || 0;

            partyMaps[
              year
            ].set(
              name,
              current + votes
            );
          }
        }
      }
    }

    // --------------------------------------------------
    // 4. Build party comparison list
    // --------------------------------------------------

    const allParties =
      new Set();

    for (const year of years) {
      for (
        const party of
        partyMaps[year].keys()
      ) {
        allParties.add(party);
      }
    }

    const partyList =
      [...allParties]
        .map((party) => {
          const baseVotes =
            partyMaps[
              baseYear
            ]?.get(party) || 0;

          const compVotes =
            partyMaps[
              compareYear
            ]?.get(party) || 0;

          const yearsData = {};

          for (
            const year of years
          ) {
            const votes =
              partyMaps[
                year
              ]?.get(party) || 0;

            yearsData[year] = {
              votes,
              boothsWon: 0,
            };
          }

          return {
            party,

            baseVotes,
            compVotes,

            baseWins: 0,
            compWins: 0,

            years: yearsData,
          };
        })
        .sort(
          (a, b) =>
            b.baseVotes -
            a.baseVotes
        );

    // --------------------------------------------------
    // 5. Timeline
    // --------------------------------------------------

    const timeline =
      years.map(
        (year) => ({
          year,

          totalVotes:
            yearStatsMap[
              year
            ]?.totalVotes || 0,

          totalBooths:
            yearStatsMap[
              year
            ]?.totalBooths || 0,
        })
      );

    // --------------------------------------------------
    // 6. Delta
    // --------------------------------------------------

    const baseStats =
      yearStatsMap[
        baseYear
      ] || {};

    const compStats =
      yearStatsMap[
        compareYear
      ] || {};

    const voteDelta =
      Number(
        baseStats.totalVotes ||
          0
      ) -
      Number(
        compStats.totalVotes ||
          0
      );

    const boothDelta =
      Number(
        baseStats.totalBooths ||
          0
      ) -
      Number(
        compStats.totalBooths ||
          0
      );

    const marginDelta =
      round2(
        Number(
          baseStats.avgWinningMargin ||
            0
        ) -
          Number(
            compStats.avgWinningMargin ||
              0
          )
      );

    const strongDelta =
      Number(
        baseStats.strongBooths ||
          0
      ) -
      Number(
        compStats.strongBooths ||
          0
      );

    const voteGrowthPct =
      Number(
        compStats.totalVotes || 0
      ) > 0
        ? round2(
            (voteDelta /
              compStats.totalVotes) *
              100
          )
        : 0;

    const delta = {
      voteDelta,
      voteGrowthPct,

      boothDelta,

      marginDelta,

      strongDelta,
    };

    // --------------------------------------------------
    // 7. District comparison matrix
    // --------------------------------------------------

    const districts = [
      ...new Set(
        acRows
          .map(
            (row) =>
              row.district
          )
          .filter(Boolean)
      ),
    ];

    const districtComparisonList =
      districts.map(
        (districtName) => {
          const baseRows =
            acRows.filter(
              (row) =>
                row.district ===
                  districtName &&
                row.election ===
                  ELECTIONS[
                    baseYear
                  ]
            );

          const compRows =
            acRows.filter(
              (row) =>
                row.district ===
                  districtName &&
                row.election ===
                  ELECTIONS[
                    compareYear
                  ]
            );

          const baseVotes =
            baseRows.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.polled || 0
                ),
              0
            );

          const compVotes =
            compRows.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.polled || 0
                ),
              0
            );

          const baseBooths =
            baseRows.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.booths || 0
                ),
              0
            );

          const compBooths =
            compRows.reduce(
              (sum, row) =>
                sum +
                Number(
                  row.booths || 0
                ),
              0
            );

          const voteDelta =
            baseVotes -
            compVotes;

          const voteGrowthPct =
            compVotes > 0
              ? round2(
                  (voteDelta /
                    compVotes) *
                    100
                )
              : 'N/A';

          return {
            district:
              districtName,

            baseVotes,
            compVotes,

            voteDelta,

            voteGrowthPct,

            baseBooths,
            compBooths,

            baseMargin: 0,
            compMargin: 0,
          };
        }
      );

    // --------------------------------------------------
    // 8. Return the structure expected by UI
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      data: {
        baseYear,
        compareYear,

        years,

        delta,

        yearStatsMap,

        partyList,

        timeline,

        districtComparisonList,
      },
    });
  } catch (error) {
    console.error(
      'API Error in /api/analytics/compare:',
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
