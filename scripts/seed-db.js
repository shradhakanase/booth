import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import connectToDatabase from '../lib/mongodb.js';
import { extractForm20Data } from '../lib/parser.js';
import { getPartyForCandidate } from '../lib/partyMapping.js';
import { District, SourceFile, Booth, Constituency, Candidate, Setting } from '../lib/models/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_ROOT = path.resolve(__dirname, '../../');

async function seedYear(year) {
  const yearNum = Number(year);
  const yearDir = path.join(DATA_ROOT, String(yearNum));

  if (!fs.existsSync(yearDir)) {
    console.log(`Directory for year ${yearNum} not found at: ${yearDir}`);
    return;
  }

  const districtDirs = fs.readdirSync(yearDir).filter(d => {
    return fs.statSync(path.join(yearDir, d)).isDirectory();
  });

  console.log(`\n========================================`);
  console.log(`SEEDING YEAR: ${yearNum} (${districtDirs.length} district directories)`);
  console.log(`========================================`);

  let totalFilesProcessed = 0;
  let totalBoothsInserted = 0;
  const districtStats = {};
  const candidateMap = {}; // key: year_district_candidate_ac

  for (const distName of districtDirs) {
    const distPath = path.join(yearDir, distName);
    const files = fs.readdirSync(distPath).filter(f => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.csv'));

    if (!files.length) continue;

    if (!districtStats[distName]) {
      districtStats[distName] = {
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
    }

    console.log(`Processing [${yearNum}] ${distName} (${files.length} files)...`);

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

        // Upsert SourceFile record
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

        // Bulk upsert Booth records
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

        // Accumulate Candidate Analytics
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

        districtStats[distName].totalFiles += 1;
        districtStats[distName].totalBooths += parsed.booths.length;
        districtStats[distName].totalVotes += parsed.meta.totalVotes;
        districtStats[distName].totalValidVotes += parsed.meta.totalValidVotes;
        districtStats[distName].totalElectors += parsed.meta.electors || 0;

        const w = parsed.constituencySummary.winner;
        if (w && w.candidate) {
          districtStats[distName].winningCandidates[w.candidate] = (districtStats[distName].winningCandidates[w.candidate] || 0) + w.votes;
        }

        totalFilesProcessed += 1;
        totalBoothsInserted += parsed.booths.length;
      } catch (err) {
        console.error(`Error processing file ${f} in ${distName}:`, err.message);
      }
    }
  }

  // Bulk upsert Candidates
  console.log(`\nUpserting Candidate analytics for year ${yearNum}...`);
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
    console.log(`Upserted ${candOps.length} candidates for year ${yearNum}!`);
  }

  // Upsert Districts
  console.log(`Upserting District summaries for year ${yearNum}...`);
  for (const [distName, dData] of Object.entries(districtStats)) {
    const winnerEntry = Object.entries(dData.winningCandidates).sort((a, b) => b[1] - a[1])[0];
    const winningCand = winnerEntry ? winnerEntry[0] : '';
    const winningParty = getPartyForCandidate(winningCand);
    const avgVotesPerBooth = dData.totalBooths > 0 ? Math.round(dData.totalVotes / dData.totalBooths) : 0;
    const constCount = await Constituency.countDocuments({ year: yearNum, district: distName });

    await District.findOneAndUpdate(
      { year: yearNum, districtName: distName },
      {
        $set: {
          year: yearNum,
          districtName: distName,
          totalFiles: dData.totalFiles,
          totalConstituencies: constCount,
          totalBooths: dData.totalBooths,
          totalVotes: dData.totalVotes,
          totalValidVotes: dData.totalValidVotes,
          totalElectors: dData.totalElectors,
          winningCandidate: winningCand,
          winningParty,
          avgVotesPerBooth,
        }
      },
      { upsert: true }
    );
  }

  console.log(`[${yearNum}] Summary: ${totalFilesProcessed} files, ${totalBoothsInserted} booths, ${Object.keys(districtStats).length} districts.`);
}

async function main() {
  await connectToDatabase();
  console.log('Connected to database successfully!');

  // Set default thresholds
  await Setting.findOneAndUpdate(
    { key: 'booth_thresholds' },
    { key: 'booth_thresholds', value: { strong: 50, medium: 30, weak: 0 }, description: 'Threshold percentage for booth classification' },
    { upsert: true }
  );

  const args = process.argv.slice(2);
  const yearArg = args.find(a => a.startsWith('--year='));
  const allArg = args.includes('--all');

  if (yearArg) {
    const y = parseInt(yearArg.split('=')[1], 10);
    await seedYear(y);
  } else if (allArg) {
    for (const y of [2024, 2022, 2019, 2017]) {
      await seedYear(y);
    }
  } else {
    // Default seed 2024
    await seedYear(2024);
  }

  console.log('\nSeeding completed.');
  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Fatal seed error:', err);
  process.exit(1);
});
