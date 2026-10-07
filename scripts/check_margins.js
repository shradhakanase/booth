import connectToDatabase from '../lib/mongodb.js';
import { Booth } from '../lib/models/index.js';

async function run() {
  await connectToDatabase();
  const count = await Booth.countDocuments();
  console.log('Total booths in DB:', count);

  const sampleZero = await Booth.find({ winningMargin: 0 }).limit(5).lean();
  console.log('\n--- Booths with winningMargin == 0 ---');
  sampleZero.forEach(b => {
    console.log(`Booth #${b.boothNo} (${b.district} - ${b.assemblyConstituency}): Winner="${b.winnerCandidate}" (${b.winnerVotes} votes, ${b.winnerParty}) vs RunnerUp="${b.runnerUpCandidate}" (${b.runnerUpVotes} votes, ${b.runnerUpParty}) Margin=${b.winningMargin}, TotalVotes=${b.totalVotes}`);
  });

  const sampleGt0 = await Booth.find({ winningMargin: { $gt: 0 } }).sort({ winningMargin: 1 }).limit(10).lean();
  console.log('\n--- Booths with winningMargin > 0 (Sorted ascending) ---');
  sampleGt0.forEach(b => {
    console.log(`Booth #${b.boothNo} (${b.district} - ${b.assemblyConstituency}): Winner="${b.winnerCandidate}" (${b.winnerVotes} votes, ${b.winnerParty}) vs RunnerUp="${b.runnerUpCandidate}" (${b.runnerUpVotes} votes, ${b.runnerUpParty}) Margin=${b.winningMargin}, TotalVotes=${b.totalVotes}`);
  });

  const nullMargin = await Booth.countDocuments({ winningMargin: null });
  console.log('\nBooths with null margin:', nullMargin);

  process.exit(0);
}

run().catch(console.error);
