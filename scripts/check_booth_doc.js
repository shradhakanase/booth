import connectToDatabase from '../lib/mongodb.js';
import { Booth } from '../lib/models/index.js';

async function run() {
  await connectToDatabase();
  const sample = await Booth.findOne({ winningMargin: { $gt: 0 } }).lean();
  console.log('Sample Booth Document Keys:', Object.keys(sample));
  console.log('Sample Booth Document:', JSON.stringify(sample, null, 2));
  process.exit(0);
}

run().catch(console.error);
