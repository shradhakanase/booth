import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import connectToDatabase from '../lib/mongodb.js';
import { extractForm20Data } from '../lib/parser.js';
import { getPartyForCandidate } from '../lib/partyMapping.js';
import { District, SourceFile, Booth, Constituency, Candidate } from '../lib/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_ROOT = path.resolve(__dirname, '../../');

async function seedDistrict(year, distName) {
  const yearNum = Number(year);
  const yearDir = path.join(DATA_ROOT, String(yearNum));
  const distPath = path.join(yearDir, distName);

  if (!fs.existsSync(distPath)) {
    console.log(`Directory not found: ${distPath}`);
    return;
  }

  const files = fs.readdirSync(distPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));
  console.log(`Seeding ${distName} for year ${yearNum} (${files.length} files)...`);

  const districtStats = {
    districtName: distName,
    year: yearNum,
    totalFiles: 0,
    totalConstituencies: 0,
    totalBooths: 0,
    totalVotes: 0,
    totalValidVotes: 0,
    totalElectors: 0,
    winningCandidates: {},
  };
  const candidateMap = {};

  for (const f of files) {
    const filePath = path.join(distPath, f);
    try {
      const fileBuffer = fs.readFileSync(filePath);
      let rawRows = [];

      if (f.endsWith('.csv')) {
        const Papa = (await import('papaparse')).default;
        const text = fileBuffer.toString('utf-8');
        const parsedCsv = Papa.parse(text, { skipEmptyLines: false });
        rawRows = parsedCsv.data;
      } else {
        const wb = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = wb.SheetNames.includes('Form20') ? 'Form20' : wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        if (!sheet) continue;
        rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
      }

      const parsed = extractForm20Data(rawRows, f, distName, { strong: 50, medium: 30 }, yearNum);
      if (!parsed.booths.length) continue;

      // Upsert SourceFile
      await SourceFile.findOneAndUpdate(
        { year: yearNum, district: distName, originalFileName: f },
        {
          year: yearNum,
          originalFileName: f,
          district: distName,
          fileType: f.split('.').pop().toLowerCase(),
          filePath: path.relative(DATA_ROOT, filePath),
          totalRows: parsed.meta.totalRows,
          totalBooths: parsed.meta.totalBooths,
          totalVotes: parsed.meta.totalVotes,
          acNo: parsed.meta.acNo || 0,
          acName: parsed.meta.acName,
          candidates: parsed.meta.candidates,
          processingStatus: 'PROCESSED',
          processingErrors: [],
          processedAt: new Date(),
        },
        { upsert: true }
      );

      // Bulk upsert Booths
      const bulkOps = parsed.booths.map(b => ({
        updateOne: {
          filter: {
            year: yearNum,
            district: b.district,
            assemblyConstituency: b.assemblyConstituency,
            boothNumber: b.boothNumber,
          },
          update: { $set: b },
          upsert: true,
        }
      }));

      if (bulkOps.length > 0) {
        await Booth.bulkWrite(bulkOps, { ordered: false });
      }

      // Upsert Constituency
      if (parsed.constituencySummary.acName) {
        await Constituency.findOneAndUpdate(
          { year: yearNum, district: distName, acName: parsed.constituencySummary.acName },
          { $set: parsed.constituencySummary },
          { upsert: true }
        );
      }

      // Candidate tracking
      for (const b of parsed.booths) {
        for (const cv of b.candidateVotes) {
          const candKey = `${yearNum}__${distName}__${cv.candidate}__${b.assemblyConstituency}`;
          if (!candidateMap[candKey]) {
            candidateMap[candKey] = {
              year: yearNum,
              candidateName: cv.candidate,
              party: cv.party,
              district: distName,
              assemblyConstituency: b.assemblyConstituency,
              acNo: b.acNo || 0,
              totalVotes: 0,
              boothsWon: 0,
              boothsLost: 0,
              totalBoothsContested: 0,
              highestVoteBooth: { boothNumber: b.boothNumber, pollingStation: b.pollingStation, votes: cv.votes, district: distName, acName: b.assemblyConstituency },
              lowestVoteBooth: { boothNumber: b.boothNumber, pollingStation: b.pollingStation, votes: cv.votes, district: distName, acName: b.assemblyConstituency },
            };
          }

          const cData = candidateMap[candKey];
          cData.totalVotes += cv.votes;
          cData.totalBoothsContested += 1;

          if (b.winner.candidate === cv.candidate) {
            cData.boothsWon += 1;
          } else {
            cData.boothsLost += 1;
          }

          if (cv.votes > cData.highestVoteBooth.votes) {
            cData.highestVoteBooth = { boothNumber: b.boothNumber, pollingStation: b.pollingStation, votes: cv.votes, district: distName, acName: b.assemblyConstituency };
          }
          if (cv.votes < cData.lowestVoteBooth.votes) {
            cData.lowestVoteBooth = { boothNumber: b.boothNumber, pollingStation: b.pollingStation, votes: cv.votes, district: distName, acName: b.assemblyConstituency };
          }
        }
      }

      districtStats.totalFiles += 1;
      districtStats.totalBooths += parsed.booths.length;
      districtStats.totalVotes += parsed.meta.totalVotes;
      districtStats.totalValidVotes += parsed.meta.totalValidVotes;
      districtStats.totalElectors += parsed.meta.electors || 0;

      const w = parsed.constituencySummary.winner;
      if (w && w.candidate) {
        districtStats.winningCandidates[w.candidate] = (districtStats.winningCandidates[w.candidate] || 0) + w.votes;
      }
    } catch (err) {
      console.error(`Error in ${f}:`, err.message);
    }
  }

  // Bulk candidates
  const candOps = Object.values(candidateMap).map(c => {
    const avgVotes = c.totalBoothsContested > 0 ? Number((c.totalVotes / c.totalBoothsContested).toFixed(1)) : 0;
    return {
      updateOne: {
        filter: {
          year: yearNum,
          district: c.district,
          candidateName: c.candidateName,
          assemblyConstituency: c.assemblyConstituency,
        },
        update: {
          $set: {
            ...c,
            avgVotesPerBooth: avgVotes,
            isWinner: c.boothsWon > c.boothsLost,
          }
        },
        upsert: true,
      }
    };
  });

  if (candOps.length > 0) {
    await Candidate.bulkWrite(candOps, { ordered: false });
  }

  // Upsert District
  const winnerEntry = Object.entries(districtStats.winningCandidates).sort((a, b) => b[1] - a[1])[0];
  const winningCand = winnerEntry ? winnerEntry[0] : '';
  const winningParty = getPartyForCandidate(winningCand);
  const avgVotesPerBooth = districtStats.totalBooths > 0 ? Math.round(districtStats.totalVotes / districtStats.totalBooths) : 0;
  const constCount = await Constituency.countDocuments({ year: yearNum, district: distName });

  await District.findOneAndUpdate(
    { year: yearNum, districtName: distName },
    {
      $set: {
        year: yearNum,
        districtName: distName,
        totalFiles: districtStats.totalFiles,
        totalConstituencies: constCount,
        totalBooths: districtStats.totalBooths,
        totalVotes: districtStats.totalVotes,
        totalValidVotes: districtStats.totalValidVotes,
        totalElectors: districtStats.totalElectors,
        winningCandidate: winningCand,
        winningParty,
        avgVotesPerBooth,
      }
    },
    { upsert: true }
  );

  console.log(`[${yearNum}] ${distName} finished: ${districtStats.totalBooths} booths, ${districtStats.totalVotes} votes.`);
}

async function run() {
  await connectToDatabase();
  console.log('Connected.');

  // Seed sample districts for 2022, 2019, 2017
  await seedDistrict(2022, 'Agra');
  await seedDistrict(2022, 'Aligarh');
  await seedDistrict(2022, 'Lucknow');

  await seedDistrict(2019, 'agra');
  await seedDistrict(2019, 'Aligarh');
  await seedDistrict(2019, 'Lucknow');

  await seedDistrict(2017, 'Agra');
  await seedDistrict(2017, 'Aligarh');
  await seedDistrict(2017, 'Lucknow');

  console.log('Sample multi-year data seeded!');
  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
