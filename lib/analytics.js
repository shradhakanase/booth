import connectToDatabase from './mongodb.js';
import { District, SourceFile, Booth, Constituency, Candidate, Setting } from './models/index.js';

/**
 * Get active booth thresholds (Strong / Medium / Weak)
 */
export async function getBoothThresholds() {
  await connectToDatabase();
  const setting = await Setting.findOne({ key: 'booth_thresholds' }).lean();
  if (setting && setting.value) {
    return setting.value;
  }
  return { strong: 50, medium: 30, weak: 0 };
}

/**
 * Overview statistics for top KPI cards & global summaries
 */
export async function getOverviewStats(filter = {}) {
  await connectToDatabase();

  const boothMatch = {};
  const queryFilter = {};

  if (filter.year) {
    boothMatch.year = Number(filter.year);
    queryFilter.year = Number(filter.year);
  }
  if (filter.district) {
    boothMatch.district = filter.district;
    queryFilter.district = filter.district;
  }
  if (filter.assemblyConstituency) {
    boothMatch.assemblyConstituency = filter.assemblyConstituency;
  }

  const districtFilter = {};
  if (filter.year) districtFilter.year = Number(filter.year);
  if (filter.district) districtFilter.districtName = filter.district;

  const [
    totalDistricts,
    totalFiles,
    totalConstituencies,
    boothAgg,
    categoryAgg,
    topDistricts,
  ] = await Promise.all([
    District.countDocuments(districtFilter),
    SourceFile.countDocuments(queryFilter),
    Constituency.countDocuments(queryFilter),
    Booth.aggregate([
      { $match: boothMatch },
      {
        $group: {
          _id: null,
          totalBooths: { $sum: 1 },
          totalVotes: { $sum: '$totalVotes' },
          totalValidVotes: { $sum: '$validVotes' },
          totalNota: { $sum: '$nota' },
          totalRejected: { $sum: '$rejectedVotes' },
          avgWinningMargin: { $avg: '$winningMargin' },
        },
      },
    ]),
    Booth.aggregate([
      { $match: boothMatch },
      {
        $group: {
          _id: '$performanceCategory',
          count: { $sum: 1 },
        },
      },
    ]),
    Booth.aggregate([
      { $match: boothMatch },
      {
        $group: {
          _id: '$district',
          booths: { $sum: 1 },
          votes: { $sum: '$totalVotes' },
        },
      },
      { $sort: { votes: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const candidatesCount = await Candidate.countDocuments(queryFilter);

  const stats = boothAgg[0] || {
    totalBooths: 0,
    totalVotes: 0,
    totalValidVotes: 0,
    totalNota: 0,
    totalRejected: 0,
    avgWinningMargin: 0,
  };

  const performanceDistribution = {
    strong: 0,
    medium: 0,
    weak: 0,
    neutral: 0,
  };
  categoryAgg.forEach((c) => {
    if (c._id && performanceDistribution[c._id] !== undefined) {
      performanceDistribution[c._id] = c.count;
    }
  });

  return {
    year: filter.year || 2024,
    totalDistricts,
    totalFiles,
    totalConstituencies,
    totalCandidates: candidatesCount,
    totalBooths: stats.totalBooths,
    totalVotes: stats.totalVotes,
    totalValidVotes: stats.totalValidVotes,
    totalNota: stats.totalNota,
    totalRejected: stats.totalRejected,
    avgWinningMargin: Math.round(stats.avgWinningMargin || 0),
    performanceDistribution,
    topDistricts: topDistricts.map((d) => ({
      district: d._id,
      booths: d.booths,
      votes: d.votes,
    })),
  };
}

/**
 * Margin analytics: closest contests (positive margins), highest victories, margin distribution
 */
export async function getMarginAnalytics(filter = {}) {
  await connectToDatabase();

  const match = { totalVotes: { $gt: 0 } };
  if (filter.year) match.year = Number(filter.year);
  if (filter.district) match.district = filter.district;
  if (filter.assemblyConstituency) match.assemblyConstituency = filter.assemblyConstituency;

  // Closest contests: filter for decisive non-zero margins first (e.g. 1, 2, 3, 4 votes)
  const closestMatch = { ...match, winningMargin: { $gt: 0 } };

  const [closestContests, biggestVictories, marginDistribution] = await Promise.all([
    Booth.find(closestMatch)
      .sort({ winningMargin: 1 })
      .limit(10)
      .lean(),
    Booth.find(match)
      .sort({ winningMargin: -1 })
      .limit(10)
      .lean(),
    Booth.aggregate([
      { $match: match },
      {
        $bucket: {
          groupBy: '$winningMargin',
          boundaries: [0, 50, 100, 200, 350, 500, 1000, 5000],
          default: '5000+',
          output: {
            count: { $sum: 1 },
            avgMargin: { $avg: '$winningMargin' },
          },
        },
      },
    ]),
  ]);

  return {
    closestContests,
    biggestVictories,
    marginDistribution,
  };
}

/**
 * Candidate performance analysis
 */
export async function getCandidateAnalytics(filter = {}) {
  await connectToDatabase();

  const match = {};
  if (filter.year) match.year = Number(filter.year);
  if (filter.district) match.district = filter.district;
  if (filter.assemblyConstituency) match.assemblyConstituency = filter.assemblyConstituency;
  if (filter.party) match.party = filter.party;

  const candidates = await Candidate.find(match)
    .sort({ totalVotes: -1 })
    .limit(50)
    .lean();

  return candidates;
}

/**
 * Recalculate and update performance categories for all booths based on updated threshold
 */
export async function reclassifyBooths(thresholds, year) {
  await connectToDatabase();
  const { strong = 50, medium = 30 } = thresholds;

  const baseQuery = {};
  if (year) baseQuery.year = Number(year);

  // Bulk update strong
  await Booth.updateMany(
    { ...baseQuery, 'winner.voteShare': { $gte: strong } },
    { $set: { performanceCategory: 'strong' } }
  );

  // Bulk update medium
  await Booth.updateMany(
    { ...baseQuery, 'winner.voteShare': { $gte: medium, $lt: strong } },
    { $set: { performanceCategory: 'medium' } }
  );

  // Bulk update weak
  await Booth.updateMany(
    { ...baseQuery, 'winner.voteShare': { $lt: medium } },
    { $set: { performanceCategory: 'weak' } }
  );

  return { success: true };
}

/**
 * Multi-Year Comparative Analytics
 * Compares datasets across multiple election years or between two specific years
 */
export async function getMultiYearComparison({
  years = [2024, 2022, 2019, 2017],
  baseYear = 2024,
  compareYear = 2022,
  district = '',
  assemblyConstituency = '',
} = {}) {
  await connectToDatabase();

  const selectedYears = (Array.isArray(years) ? years : [years])
    .map(Number)
    .filter((y) => !isNaN(y) && y > 0);

  const baseMatch = {};
  if (district) baseMatch.district = { $regex: new RegExp(`^${district}$`, 'i') };
  if (assemblyConstituency) {
    baseMatch.assemblyConstituency = { $regex: new RegExp(assemblyConstituency, 'i') };
  }

  // 1. Per-Year High-Level Metrics
  const yearAggPromises = selectedYears.map(async (yr) => {
    const match = { ...baseMatch, year: yr };
    const [boothStats, categoryAgg, districtCount, candCount] = await Promise.all([
      Booth.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalBooths: { $sum: 1 },
            totalVotes: { $sum: '$totalVotes' },
            validVotes: { $sum: '$validVotes' },
            totalNota: { $sum: '$nota' },
            totalRejected: { $sum: '$rejectedVotes' },
            avgWinningMargin: { $avg: '$winningMargin' },
          },
        },
      ]),
      Booth.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$performanceCategory',
            count: { $sum: 1 },
          },
        },
      ]),
      District.countDocuments({
        year: yr,
        ...(district ? { districtName: { $regex: new RegExp(`^${district}$`, 'i') } } : {}),
      }),
      Candidate.countDocuments({
        year: yr,
        ...(district ? { district: { $regex: new RegExp(`^${district}$`, 'i') } } : {}),
      }),
    ]);

    const stats = boothStats[0] || {
      totalBooths: 0,
      totalVotes: 0,
      validVotes: 0,
      totalNota: 0,
      totalRejected: 0,
      avgWinningMargin: 0,
    };

    const categories = { strong: 0, medium: 0, weak: 0 };
    categoryAgg.forEach((c) => {
      if (c._id && categories[c._id] !== undefined) {
        categories[c._id] = c.count;
      }
    });

    return {
      year: yr,
      totalBooths: stats.totalBooths,
      totalVotes: stats.totalVotes,
      validVotes: stats.validVotes,
      totalNota: stats.totalNota,
      totalRejected: stats.totalRejected,
      avgWinningMargin: Math.round(stats.avgWinningMargin || 0),
      totalDistricts: districtCount,
      totalCandidates: candCount,
      strongBooths: categories.strong,
      mediumBooths: categories.medium,
      weakBooths: categories.weak,
      strongPct: stats.totalBooths > 0 ? Number(((categories.strong / stats.totalBooths) * 100).toFixed(1)) : 0,
      mediumPct: stats.totalBooths > 0 ? Number(((categories.medium / stats.totalBooths) * 100).toFixed(1)) : 0,
      weakPct: stats.totalBooths > 0 ? Number(((categories.weak / stats.totalBooths) * 100).toFixed(1)) : 0,
    };
  });

  const yearStats = await Promise.all(yearAggPromises);
  const yearStatsMap = {};
  yearStats.forEach((s) => {
    yearStatsMap[s.year] = s;
  });

  // 2. Head-to-Head Delta Calculation
  const bStats = yearStatsMap[Number(baseYear)] || {
    totalVotes: 0,
    totalBooths: 0,
    validVotes: 0,
    avgWinningMargin: 0,
    strongBooths: 0,
    mediumBooths: 0,
    weakBooths: 0,
  };
  const cStats = yearStatsMap[Number(compareYear)] || {
    totalVotes: 0,
    totalBooths: 0,
    validVotes: 0,
    avgWinningMargin: 0,
    strongBooths: 0,
    mediumBooths: 0,
    weakBooths: 0,
  };

  const voteDelta = bStats.totalVotes - cStats.totalVotes;
  const voteGrowthPct = cStats.totalVotes > 0 ? ((voteDelta / cStats.totalVotes) * 100).toFixed(1) : 'N/A';
  const boothDelta = bStats.totalBooths - cStats.totalBooths;
  const boothGrowthPct = cStats.totalBooths > 0 ? ((boothDelta / cStats.totalBooths) * 100).toFixed(1) : 'N/A';
  const marginDelta = bStats.avgWinningMargin - cStats.avgWinningMargin;
  const strongDelta = bStats.strongBooths - cStats.strongBooths;
  const mediumDelta = bStats.mediumBooths - cStats.mediumBooths;
  const weakDelta = bStats.weakBooths - cStats.weakBooths;

  // 3. Multi-Year Party Dominance Trends
  const partyAgg = await Booth.aggregate([
    {
      $match: {
        ...baseMatch,
        year: { $in: selectedYears },
        'winner.party': { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: {
          year: '$year',
          party: '$winner.party',
        },
        boothsWon: { $sum: 1 },
        totalVotes: { $sum: '$winner.votes' },
      },
    },
    { $sort: { boothsWon: -1 } },
  ]);

  const partyComparisonMap = {};
  partyAgg.forEach((item) => {
    const pName = item._id.party || 'IND';
    const yr = item._id.year;
    if (!partyComparisonMap[pName]) {
      partyComparisonMap[pName] = { party: pName, years: {} };
    }
    partyComparisonMap[pName].years[yr] = {
      boothsWon: item.boothsWon,
      totalVotes: item.totalVotes,
    };
  });

  const partyList = Object.values(partyComparisonMap)
    .map((p) => {
      const baseWins = p.years[Number(baseYear)]?.boothsWon || 0;
      const compWins = p.years[Number(compareYear)]?.boothsWon || 0;
      const baseVotes = p.years[Number(baseYear)]?.totalVotes || 0;
      const compVotes = p.years[Number(compareYear)]?.totalVotes || 0;

      return {
        party: p.party,
        baseWins,
        compWins,
        winDelta: baseWins - compWins,
        baseVotes,
        compVotes,
        voteDelta: baseVotes - compVotes,
        years: p.years,
      };
    })
    .sort((a, b) => (b.baseWins + b.compWins) - (a.baseWins + a.compWins))
    .slice(0, 12);

  // 4. District-by-District Comparative Matrix
  const districtAgg = await Booth.aggregate([
    {
      $match: {
        ...baseMatch,
        year: { $in: selectedYears },
      },
    },
    {
      $group: {
        _id: {
          district: '$district',
          year: '$year',
        },
        totalBooths: { $sum: 1 },
        totalVotes: { $sum: '$totalVotes' },
        avgWinningMargin: { $avg: '$winningMargin' },
      },
    },
    { $sort: { '_id.district': 1 } },
  ]);

  const districtComparisonMap = {};
  districtAgg.forEach((d) => {
    const dName = d._id.district;
    const yr = d._id.year;
    if (!districtComparisonMap[dName]) {
      districtComparisonMap[dName] = { district: dName, years: {} };
    }
    districtComparisonMap[dName].years[yr] = {
      totalBooths: d.totalBooths,
      totalVotes: d.totalVotes,
      avgMargin: Math.round(d.avgWinningMargin || 0),
    };
  });

  const districtComparisonList = Object.values(districtComparisonMap)
    .map((d) => {
      const bData = d.years[Number(baseYear)] || { totalVotes: 0, totalBooths: 0, avgMargin: 0 };
      const cData = d.years[Number(compareYear)] || { totalVotes: 0, totalBooths: 0, avgMargin: 0 };
      const vDelta = bData.totalVotes - cData.totalVotes;
      const vPct = cData.totalVotes > 0 ? ((vDelta / cData.totalVotes) * 100).toFixed(1) : 'N/A';

      return {
        district: d.district,
        baseVotes: bData.totalVotes,
        compVotes: cData.totalVotes,
        voteDelta: vDelta,
        voteGrowthPct: vPct,
        baseBooths: bData.totalBooths,
        compBooths: cData.totalBooths,
        baseMargin: bData.avgMargin,
        compMargin: cData.avgMargin,
        years: d.years,
      };
    })
    .sort((a, b) => b.baseVotes - a.baseVotes);

  // 5. Multi-Year Chronological Timeline for Line/Area Charts
  const chronologicalTimeline = [...yearStats].sort((a, b) => a.year - b.year);

  return {
    selectedYears,
    baseYear: Number(baseYear),
    compareYear: Number(compareYear),
    yearStats,
    yearStatsMap,
    delta: {
      voteDelta,
      voteGrowthPct,
      boothDelta,
      boothGrowthPct,
      marginDelta,
      strongDelta,
      mediumDelta,
      weakDelta,
    },
    partyList,
    districtComparisonList,
    timeline: chronologicalTimeline,
  };
}
