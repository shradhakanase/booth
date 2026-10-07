import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '@/lib/mongodb.js';
import { parseForm20File, extractForm20Data } from '@/lib/parser.js';
import { getBoothThresholds } from '@/lib/analytics.js';
import { District, SourceFile, Booth, Constituency, Candidate } from '@/lib/models/index.js';

export const dynamic = 'force-dynamic';

/**
 * Common helper to save parsed election data into MongoDB
 */
async function persistElectionData(parsed, originalFileName, districtHint, thresholds, yearHint, fileHash) {
  const { meta, constituencySummary, booths } = parsed;
  const district = meta.district || districtHint || 'General';
  const year = Number(meta.year) || (yearHint !== 'auto' && Number(yearHint) > 0 ? Number(yearHint) : 2024);

  // Check if identical hash already processed for this year
  const existingFile = fileHash ? await SourceFile.findOne({ year, fileHash }).lean() : null;
  const isReupload = !!existingFile;

  // Upsert SourceFile record
  await SourceFile.findOneAndUpdate(
    { year, district, originalFileName },
    {
      year,
      originalFileName,
      district,
      fileType: originalFileName.split('.').pop().toLowerCase(),
      fileHash: fileHash || crypto.createHash('sha256').update(originalFileName + year + district).digest('hex'),
      totalRows: meta.totalRows,
      totalBooths: booths.length,
      totalVotes: meta.totalVotes,
      acNo: meta.acNo,
      acName: meta.acName,
      candidates: meta.candidates,
      processingStatus: 'PROCESSED',
      processingErrors: [],
      processedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  // Bulk upsert Booth records (preventing duplicate booth entries)
  const bulkOps = booths.map((b) => ({
    updateOne: {
      filter: {
        year,
        district: b.district,
        assemblyConstituency: b.assemblyConstituency,
        boothNumber: b.boothNumber,
      },
      update: { $set: { ...b, year } },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await Booth.bulkWrite(bulkOps, { ordered: false });
  }

  // Upsert Constituency
  if (constituencySummary.acNo || constituencySummary.acName) {
    await Constituency.findOneAndUpdate(
      {
        year,
        district,
        acName: constituencySummary.acName,
      },
      { $set: { ...constituencySummary, year, district } },
      { upsert: true }
    );
  }

  // Update Candidate stats
  for (const cand of constituencySummary.candidateTotals || []) {
    await Candidate.findOneAndUpdate(
      {
        year,
        district,
        candidateName: cand.candidate,
        assemblyConstituency: constituencySummary.acName,
      },
      {
        $set: {
          year,
          candidateName: cand.candidate,
          party: cand.party,
          district,
          assemblyConstituency: constituencySummary.acName,
          acNo: constituencySummary.acNo,
          totalVotes: cand.votes,
          voteShare: cand.voteShare,
          boothsWon: cand.boothsWon,
          totalBoothsContested: booths.length,
          isWinner: constituencySummary.winner.candidate === cand.candidate,
        },
      },
      { upsert: true }
    );
  }

  // Update District aggregates
  const allDistBooths = await Booth.aggregate([
    { $match: { year, district } },
    {
      $group: {
        _id: null,
        totalBooths: { $sum: 1 },
        totalVotes: { $sum: '$totalVotes' },
        totalValidVotes: { $sum: '$validVotes' },
      },
    },
  ]);

  const distStats = allDistBooths[0] || { totalBooths: 0, totalVotes: 0, totalValidVotes: 0 };
  const totalFiles = await SourceFile.countDocuments({ year, district });
  const totalConsts = await Constituency.countDocuments({ year, district });

  await District.findOneAndUpdate(
    { year, districtName: district },
    {
      $set: {
        year,
        districtName: district,
        totalFiles,
        totalConstituencies: totalConsts,
        totalBooths: distStats.totalBooths,
        totalVotes: distStats.totalVotes,
        totalValidVotes: distStats.totalValidVotes,
        avgVotesPerBooth: distStats.totalBooths > 0 ? Math.round(distStats.totalVotes / distStats.totalBooths) : 0,
      },
    },
    { upsert: true }
  );

  return {
    fileName: originalFileName,
    district,
    year,
    status: 'SUCCESS',
    isReupload,
    totalBooths: booths.length,
    totalVotes: meta.totalVotes,
    constituency: meta.acName,
    candidatesCount: meta.candidates.length,
    winner: constituencySummary.winner.candidate,
    winningParty: constituencySummary.winner.party,
    winningMargin: constituencySummary.winningMargin,
  };
}

export async function POST(request) {
  try {
    await connectToDatabase();
    const thresholds = await getBoothThresholds();
    const contentType = request.headers.get('content-type') || '';

    const results = [];

    if (contentType.includes('application/json')) {
      // Direct JSON Payload (Pre-extracted sheet rows from client, bypasses 4.5MB limits)
      const body = await request.json();
      const items = Array.isArray(body.files) ? body.files : (Array.isArray(body) ? body : [body]);

      for (const item of items) {
        const { fileName, rows, district: districtHint = '', year: rawYear } = item;
        const yearHint = rawYear && rawYear !== 'auto' ? Number(rawYear) : 'auto';

        if (!fileName || !rows || !Array.isArray(rows)) {
          results.push({
            fileName: fileName || 'unknown',
            status: 'FAILED',
            error: 'Missing fileName or rows array in JSON payload',
          });
          continue;
        }

        const fileHash = crypto.createHash('sha256').update(JSON.stringify(rows)).digest('hex');

        try {
          const parsed = extractForm20Data(rows, fileName, districtHint, thresholds, yearHint);
          const res = await persistElectionData(parsed, fileName, districtHint, thresholds, yearHint, fileHash);
          results.push(res);
        } catch (err) {
          console.error(`Upload parsing error for ${fileName}:`, err);
          results.push({
            fileName,
            year: Number(yearHint) || 2024,
            status: 'FAILED',
            error: err.message,
          });
        }
      }
    } else {
      // Multipart FormData Payload
      const formData = await request.formData();
      const files = formData.getAll('file');
      const districtHint = formData.get('district') || '';
      const rawYear = formData.get('year');
      const yearHint = rawYear && rawYear !== 'auto' ? Number(rawYear) : 'auto';

      if (!files || files.length === 0) {
        return NextResponse.json({ success: false, error: 'No files uploaded' }, { status: 400 });
      }

      for (const file of files) {
        const originalFileName = file.name;
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

        try {
          const parsed = await parseForm20File(buffer, originalFileName, districtHint, thresholds, yearHint);
          const res = await persistElectionData(parsed, originalFileName, districtHint, thresholds, yearHint, fileHash);
          results.push(res);
        } catch (err) {
          console.error(`Upload parsing error for ${originalFileName}:`, err);
          await SourceFile.findOneAndUpdate(
            { year: Number(yearHint) || 2024, district: districtHint || 'General', originalFileName },
            {
              year: Number(yearHint) || 2024,
              originalFileName,
              district: districtHint || 'General',
              fileType: originalFileName.split('.').pop().toLowerCase(),
              processingStatus: 'FAILED',
              processingErrors: [err.message],
              processedAt: new Date(),
            },
            { upsert: true }
          );

          results.push({
            fileName: originalFileName,
            year: Number(yearHint) || 2024,
            status: 'FAILED',
            error: err.message,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} files`,
      results,
    });
  } catch (error) {
    console.error('API Error in /api/upload:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
