import connectToDatabase from '../lib/mongodb.js';
import { SourceFile, Booth, District, Constituency, Candidate } from '../lib/models/index.js';

async function generateSummary() {
  await connectToDatabase();
  const years = [2017, 2019, 2022, 2024];

  console.log('\n=================== ELECTION DATABASE SUMMARY ===================');
  for (const y of years) {
    const fileCount = await SourceFile.countDocuments({ year: y });
    const boothCount = await Booth.countDocuments({ year: y });
    const distCount = await District.countDocuments({ year: y });
    const constCount = await Constituency.countDocuments({ year: y });
    const candidateCount = await Candidate.countDocuments({ year: y });

    const voteSum = await Booth.aggregate([
      { $match: { year: y } },
      {
        $group: {
          _id: null,
          totalVotes: { $sum: '$totalVotes' },
          validVotes: { $sum: '$validVotes' },
          nota: { $sum: '$nota' },
        },
      },
    ]);

    const totalVotes = voteSum[0]?.totalVotes || 0;
    const validVotes = voteSum[0]?.validVotes || 0;
    const notaVotes = voteSum[0]?.nota || 0;

    console.log(`\n--- YEAR ${y} ---`);
    console.log(`  Source Files:     ${fileCount.toLocaleString()}`);
    console.log(`  Districts:        ${distCount.toLocaleString()}`);
    console.log(`  Constituencies:   ${constCount.toLocaleString()}`);
    console.log(`  Candidates:       ${candidateCount.toLocaleString()}`);
    console.log(`  Total Booths:     ${boothCount.toLocaleString()}`);
    console.log(`  Total Votes Cast: ${totalVotes.toLocaleString()}`);
    console.log(`  Valid Votes:      ${validVotes.toLocaleString()}`);
    console.log(`  NOTA Votes:       ${notaVotes.toLocaleString()}`);
  }
  console.log('\n=================================================================\n');

  process.exit(0);
}

generateSummary().catch(err => {
  console.error(err);
  process.exit(1);
});



