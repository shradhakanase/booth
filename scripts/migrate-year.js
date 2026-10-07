import mongoose from 'mongoose';
import connectToDatabase from '../lib/mongodb.js';
import { District, SourceFile, Booth, Constituency, Candidate } from '../lib/models/index.js';

async function migrate() {
  console.log('Connecting to database...');
  await connectToDatabase();
  console.log('Connected.');

  // 1. Update year on all collections where year is missing
  console.log('Backfilling year: 2024 on existing records...');
  const boothRes = await Booth.updateMany({ year: { $exists: false } }, { $set: { year: 2024 } });
  console.log(`Updated Booths: ${boothRes.modifiedCount}`);

  const distRes = await District.updateMany({ year: { $exists: false } }, { $set: { year: 2024 } });
  console.log(`Updated Districts: ${distRes.modifiedCount}`);

  const constRes = await Constituency.updateMany({ year: { $exists: false } }, { $set: { year: 2024 } });
  console.log(`Updated Constituencies: ${constRes.modifiedCount}`);

  const candRes = await Candidate.updateMany({ year: { $exists: false } }, { $set: { year: 2024 } });
  console.log(`Updated Candidates: ${candRes.modifiedCount}`);

  const fileRes = await SourceFile.updateMany({ year: { $exists: false } }, { $set: { year: 2024 } });
  console.log(`Updated SourceFiles: ${fileRes.modifiedCount}`);

  // 2. Drop legacy indexes that didn't include year
  console.log('Dropping legacy single/non-year unique indexes...');
  const dropIndexSafe = async (collection, indexName) => {
    try {
      await collection.dropIndex(indexName);
      console.log(`Dropped index ${indexName} from ${collection.collectionName}`);
    } catch (e) {
      // index might not exist
    }
  };

  const db = mongoose.connection.db;
  await dropIndexSafe(db.collection('districts'), 'districtName_1');
  await dropIndexSafe(db.collection('constituencies'), 'acNo_1');
  await dropIndexSafe(db.collection('constituencies'), 'district_1_acName_1');
  await dropIndexSafe(db.collection('sourcefiles'), 'district_1_originalFileName_1');
  await dropIndexSafe(db.collection('booths'), 'district_1_assemblyConstituency_1_boothNumber_1');
  await dropIndexSafe(db.collection('candidates'), 'district_1_candidateName_1_assemblyConstituency_1');

  // 3. Re-sync model indexes
  console.log('Creating new year-aware indexes...');
  await Booth.syncIndexes();
  await District.syncIndexes();
  await Constituency.syncIndexes();
  await Candidate.syncIndexes();
  await SourceFile.syncIndexes();

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
