import mongoose from 'mongoose';
import { connectToDatabase } from '../lib/mongodb.js';
import Booth from '../lib/models/Booth.js';

async function test() {
  await connectToDatabase();
  const zeros = await Booth.find({ winningMargin: 0 }).limit(5).lean();
  console.log('Zero margin samples:');
  for (const b of zeros) {
    console.log(b.district, b.assemblyConstituency, 'Booth:', b.boothNumber);
    console.log('  Winner:', b.winner);
    console.log('  RunnerUp:', b.runnerUp);
    console.log('  Top 3 votes:', b.candidateVotes.slice(0, 3));
  }

  const nonZeros = await Booth.find({ winningMargin: { $gt: 0 } }).sort({ winningMargin: 1 }).limit(10).lean();
  console.log('\nSmallest positive margins:');
  for (const b of nonZeros) {
    console.log(b.district, b.assemblyConstituency, 'Booth:', b.boothNumber, 'Margin:', b.winningMargin, 'Winner:', b.winner?.candidate, b.winner?.votes, 'RunnerUp:', b.runnerUp?.candidate, b.runnerUp?.votes);
  }
  process.exit(0);
}
test();
