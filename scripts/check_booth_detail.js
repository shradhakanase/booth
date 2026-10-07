import connectToDatabase from '../lib/mongodb.js';
import { Booth } from '../lib/models/index.js';

async function run() {
  await connectToDatabase();
  const booths = await Booth.find({ boothNumber: { $in: [18, 301, 172, 322] }, district: 'Agra' }).limit(5).lean();
  booths.forEach(b => {
    console.log(`\nBooth #${b.boothNumber} (${b.district} - ${b.assemblyConstituency}):`);
    console.log('Winner:', b.winner);
    console.log('RunnerUp:', b.runnerUp);
    console.log('WinningMargin:', b.winningMargin);
    console.log('CandidateVotes (top 3):', b.candidateVotes?.slice(0, 4));
  });
  process.exit(0);
}

run().catch(console.error);
