import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { getPartyForCandidate, normalizePartyName, cleanCandidateName } from './partyMapping.js';
import { selectBestSheet, cleanSheetRows } from './sheetHelper.js';

export { selectBestSheet, cleanSheetRows };

/**
 * Robust Form 20 Parser for Excel, CSV and PDF buffers
 */
export async function parseForm20File(fileBuffer, originalFileName, districtHint = '', thresholds = { strong: 50, medium: 30 }, year = 2024) {
  const ext = originalFileName.split('.').pop().toLowerCase();
  
  if (ext === 'csv') {
    return parseCsvBuffer(fileBuffer, originalFileName, districtHint, thresholds, year);
  } else if (ext === 'xlsx' || ext === 'xls') {
    return parseXlsxBuffer(fileBuffer, originalFileName, districtHint, thresholds, year);
  } else if (ext === 'pdf') {
    return parsePdfBuffer(fileBuffer, originalFileName, districtHint, thresholds, year);
  } else {
    throw new Error(`Unsupported file extension: .${ext}`);
  }
}

/**
 * Parse XLSX buffer
 */
export function parseXlsxBuffer(buffer, originalFileName, districtHint = '', thresholds = { strong: 50, medium: 30 }, year = 2024) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const { rows } = selectBestSheet(workbook);
  const cleaned = cleanSheetRows(rows);
  return extractForm20Data(cleaned, originalFileName, districtHint, thresholds, year);
}

/**
 * Parse CSV buffer
 */
export function parseCsvBuffer(buffer, originalFileName, districtHint = '', thresholds = { strong: 50, medium: 30 }, year = 2024) {
  const text = buffer.toString('utf-8');
  const parsed = Papa.parse(text, { skipEmptyLines: false });
  const cleaned = cleanSheetRows(parsed.data);
  return extractForm20Data(cleaned, originalFileName, districtHint, thresholds, year);
}

/**
 * Parse PDF buffer fallback
 */
export async function parsePdfBuffer(buffer, originalFileName, districtHint = '', thresholds = { strong: 50, medium: 30 }, year = 2024) {
  try {
    const pdfParse = (await import('pdf-parse')).default;
    const data = await pdfParse(buffer);
    const lines = data.text.split('\n').map(l => l.trim()).filter(Boolean);
    const rows = lines.map(line => line.split(/\s{2,}|\t/).map(c => c.trim()));
    const cleaned = cleanSheetRows(rows);
    return extractForm20Data(cleaned, originalFileName, districtHint, thresholds, year);
  } catch (err) {
    throw new Error(`PDF parsing failed: ${err.message}. For best accuracy with complex tables, upload converted XLSX.`);
  }
}

/**
 * Core normalization and data extraction algorithm
 */
export function extractForm20Data(rows, originalFileName, districtHint = '', thresholds = { strong: 50, medium: 30 }, year = 2024) {
  if (!rows || rows.length < 5) {
    throw new Error('File has insufficient rows for a valid Form 20 sheet.');
  }

  // 1. Detect Metadata (AC, District, Year, Electors) from header lines (rows 0 to 7)
  let district = districtHint ? districtHint.trim() : '';
  let acName = '';
  let acNo = null;
  let electors = 0;
  let sourcePdf = originalFileName;
  let detectedYear = null;

  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const row = rows[r] || [];
    const fullRowStr = row.filter(Boolean).map(String).join(' ');

    // Detect Year from header text
    if (!detectedYear) {
      const yearMatch = fullRowStr.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) {
        const yVal = parseInt(yearMatch[1], 10);
        if (yVal >= 1950 && yVal <= 2050) {
          detectedYear = yVal;
        }
      }
    }

    if (!district) {
      const distMatch = fullRowStr.match(/District\s*[-–:]\s*([A-Za-z\s]+)/i);
      if (distMatch && !distMatch[1].includes('____')) {
        district = distMatch[1].trim();
      }
    }

    if (fullRowStr.includes('Assembly') || fullRowStr.includes('segment') || fullRowStr.includes('Constituency') || fullRowStr.includes('AC No.')) {
      const acMatch = fullRowStr.match(/(\d+)\s*[-–]\s*([A-Za-z0-9\s.()]+)/);
      if (acMatch) {
        acNo = parseInt(acMatch[1], 10);
        acName = acMatch[2].replace(/Assembly Election|Assembly Constituency|segment|____+/gi, '').trim();
      } else if (fullRowStr.includes('...')) {
        acName = fullRowStr.split('...').pop().replace(/Assembly Election|Assembly Constituency/gi, '').trim();
      }
    }

    if (fullRowStr.includes('Electors') || fullRowStr.includes('electors')) {
      const elecMatch = fullRowStr.match(/\.{3,}\s*(\d+)/) || fullRowStr.match(/[-–:]\s*(\d+)/);
      if (elecMatch) {
        electors = parseInt(elecMatch[1], 10) || 0;
      }
    }

    if (fullRowStr.includes('Source file:')) {
      sourcePdf = fullRowStr.replace('Source file:', '').trim();
    }
  }

  // Resolve Year
  let resolvedYear = (year && year !== 'auto' && Number(year) > 0) ? Number(year) : (detectedYear || null);
  if (!resolvedYear) {
    const fileYearMatch = originalFileName.match(/\b(19\d{2}|20\d{2})\b/);
    if (fileYearMatch) {
      resolvedYear = parseInt(fileYearMatch[1], 10);
    }
  }
  if (!resolvedYear) {
    resolvedYear = 2024;
  }

  // Fallback AC Name & District
  const UP_AC_NAMES = {
    86: 'Etmadpur', 87: 'Agra Cantt', 88: 'Agra South', 89: 'Agra North', 90: 'Agra Rural',
    91: 'Fatehpur Sikri', 92: 'Kheragarh', 93: 'Fatehabad', 94: 'Bah',
    162: 'Bangarmau', 163: 'Safipur', 164: 'Mohan', 165: 'Unnao', 166: 'Bhagwant Nagar', 167: 'Purwa'
  };

  const baseNum = parseInt(originalFileName.replace(/\.[^/.]+$/, '').replace(/^AC[-_\s]*/i, '').trim(), 10);
  if (!acNo && !isNaN(baseNum) && baseNum > 0) {
    acNo = baseNum;
  }

  if ((!acName || acName.startsWith('AC-')) && acNo && UP_AC_NAMES[acNo]) {
    acName = `${acNo} - ${UP_AC_NAMES[acNo]}`;
  } else if (!acName) {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '').replace(/^AC/i, '');
    acName = acNo && UP_AC_NAMES[acNo] ? `${acNo} - ${UP_AC_NAMES[acNo]}` : `AC-${baseName}`;
  }

  if (!district || district.includes('____')) {
    district = districtHint || 'General';
  }

  // 2. Identify Table Format Type
  // Check if sheet uses Format B: Multi-tier triplet/pair columns with "Party" and "Secured" subheaders
  let isTripletFormat = false;
  let subHeaderRowIdx = -1;
  let candidateCols = [];
  let notaColIdx = -1;
  let totalValidColIdx = -1;
  let rejectedColIdx = -1;
  let dataStartRowIdx = -1;

  for (let r = 2; r < Math.min(8, rows.length); r++) {
    const row = rows[r] || [];
    const partyCount = row.filter(x => x && (String(x).toLowerCase().includes('party') || String(x).toLowerCase().includes('affiliation'))).length;
    const securedCount = row.filter(x => x && (String(x).toLowerCase().includes('secured') || String(x).toLowerCase().includes('turnour') || String(x).toLowerCase().includes('votes turn'))).length;
    if (partyCount >= 2 || (partyCount >= 1 && securedCount >= 1) || securedCount >= 2) {
      isTripletFormat = true;
      subHeaderRowIdx = r;
      break;
    }
  }

  if (isTripletFormat) {
    // Format B: Multi-tier triplet/pair format (2017, 2019, 2022 UP Election XLS files)
    const subHeaderRow = rows[subHeaderRowIdx] || [];

    for (let c = 0; c < subHeaderRow.length; c++) {
      const sub = String(subHeaderRow[c] || '').trim().toLowerCase();

      // Check trailing/special columns across rows around subheader
      for (let rIdx = subHeaderRowIdx; rIdx >= 0; rIdx--) {
        const rCells = rows[rIdx] || [];
        const cellVal = String(rCells[c] || '').trim().toLowerCase();
        if (cellVal.includes('nota') || cellVal.includes('none of the above')) {
          if (notaColIdx === -1) notaColIdx = c;
        } else if (cellVal.includes('total votes') || cellVal.includes('total of valid') || cellVal.includes('total valid')) {
          if (totalValidColIdx === -1) totalValidColIdx = c;
        } else if (cellVal.includes('rejected')) {
          if (rejectedColIdx === -1) rejectedColIdx = c;
        }
      }

      const isVoteSubCol = sub.includes('secured') || sub.includes('turnour') || (sub.includes('votes') && !sub.includes('total') && !sub.includes('valid')) || (sub.includes('voter') && !sub.includes('total') && !sub.includes('turnout'));

      if (isVoteSubCol) {
        let cName = '';
        // Search across all previous rows (from subHeaderRowIdx - 1 down to row 0) and back up to 2 columns
        for (let rIdx = subHeaderRowIdx - 1; rIdx >= 0; rIdx--) {
          const candRow = rows[rIdx] || [];
          for (let back = c; back >= Math.max(0, c - 2); back--) {
            const val = candRow[back];
            if (val && typeof val === 'string' && val.trim() !== '' && isNaN(Number(val))) {
              const cleanVal = val.trim().toLowerCase();
              if (!cleanVal.includes('polling') && !cleanVal.includes('electors') && !cleanVal.includes('turnout') && !cleanVal.includes('epic') && !cleanVal.includes('tendered') && !cleanVal.includes('total') && !cleanVal.includes('s. no.') && !cleanVal.includes('party') && !cleanVal.includes('affiliation') && !cleanVal.includes('district') && !cleanVal.includes('assembly') && !cleanVal.includes('election')) {
                cName = String(val).trim().replace(/\r?\n+/g, ' ');
                break;
              }
            }
          }
          if (cName) break;
        }

        const partyColIdx = c - 1;

        if (cName) {
          if (cName.toLowerCase().includes('nota') || cName.toLowerCase().includes('none of the above')) {
            notaColIdx = c;
          } else {
            const cleaned = cleanCandidateName(cName);
            candidateCols.push({
              colIndex: c,
              candidateName: cleaned,
              partyColIdx,
              voteColIdx: c,
            });
          }
        }
      }
    }

    // Find first row of booth data (skip column index row e.g. [1, 2, 3...])
    for (let r = subHeaderRowIdx + 1; r < Math.min(10, rows.length); r++) {
      const row = rows[r];
      if (row && row.length > 0) {
        const isColumnNumberRow = row[0] === 1 && row[1] === 2 && row[2] === 3;
        if (!isColumnNumberRow) {
          const b1 = typeof row[1] === 'number' ? row[1] : parseInt(row[1], 10);
          const b0 = typeof row[0] === 'number' ? row[0] : parseInt(row[0], 10);
          if (b1 === 1 || b0 === 1 || (b1 > 0 && typeof row[2] === 'string')) {
            dataStartRowIdx = r;
            break;
          }
        }
      }
    }
    if (dataStartRowIdx === -1) dataStartRowIdx = subHeaderRowIdx + 2;
  } else {
    // Format A: Flat 1-column per candidate
    for (let r = 2; r < Math.min(25, rows.length); r++) {
      const row = rows[r] || [];
      const b0 = Number(row[0]);
      const b1 = Number(row[1]);
      if ((b0 === 1 || b1 === 1) && row.some((c, i) => i >= 2 && typeof c === 'number' && c > 0)) {
        dataStartRowIdx = r;
        break;
      }
    }

    if (dataStartRowIdx === -1) {
      for (let r = 5; r < Math.min(15, rows.length); r++) {
        const row = rows[r] || [];
        if (row && typeof row[0] === 'number' && row[0] > 0) {
          dataStartRowIdx = r;
          break;
        }
      }
    }
    if (dataStartRowIdx === -1) dataStartRowIdx = 7;

    let candRowIdx = dataStartRowIdx - 1;
    const prevRow = rows[candRowIdx] || [];
    const isColNums = prevRow.filter(x => x !== null && x !== undefined).every(x => typeof x === 'number' || /^\d+$/.test(String(x).trim()));
    if (isColNums && candRowIdx > 0) {
      candRowIdx--;
    }

    const testDataRow = rows[dataStartRowIdx] || [];
    const isCol1Numeric = typeof testDataRow[1] === 'number' || (typeof testDataRow[1] === 'string' && /^\d+$/.test(testDataRow[1].trim()));
    const startCandCol = isCol1Numeric ? 1 : 2;

    const candRow = rows[candRowIdx] || [];
    const superRow = candRowIdx > 0 ? (rows[candRowIdx - 1] || []) : [];

    for (let c = startCandCol; c < Math.max(candRow.length, superRow.length); c++) {
      const cVal = String(candRow[c] || '').trim();
      const sVal = String(superRow[c] || '').trim();
      const combined = (cVal + ' ' + sVal).toLowerCase();

      if (combined.includes('nota') || combined.includes('none of') || combined.includes('buesa ls dksb') || combined.includes('uksvk')) {
        if (notaColIdx === -1) notaColIdx = c;
      } else if (combined.includes('dqy fof/keku') || combined.includes('total valid') || combined.includes('total of valid') || combined.includes('fof/keku;')) {
        if (totalValidColIdx === -1) totalValidColIdx = c;
      } else if (combined.includes('rejected') || combined.includes('vlohdir') || combined.includes('izfr{ksfir')) {
        if (rejectedColIdx === -1) rejectedColIdx = c;
      } else if (cVal && isNaN(Number(cVal)) && cVal.length > 1 && !/total|valid|rejected|tendered|fufonrr|izfr{ksfir|erns;|mkys|fo\/kku|fof\/|fu;e|vfure/i.test(cVal)) {
        const cleaned = cleanCandidateName(cVal);
        candidateCols.push({
          colIndex: c,
          candidateName: cleaned,
          party: getPartyForCandidate(cleaned),
          voteColIdx: c,
        });
      }
    }
  }

  // 3. Process Booth Data Rows & Accumulate Candidate Stats
  const booths = [];
  let fileTotalVotes = 0;
  let fileValidVotes = 0;
  let fileNotaVotes = 0;
  const candidateAccumulator = {};

  candidateCols.forEach(c => {
    candidateAccumulator[c.candidateName] = {
      candidate: c.candidateName,
      party: c.party || '',
      votes: 0,
      boothsWon: 0,
    };
  });

  for (let r = dataStartRowIdx; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const firstCell = row[0] !== null && row[0] !== undefined ? String(row[0]).trim() : '';
    const secondCell = row[1] !== null && row[1] !== undefined ? String(row[1]).trim() : '';
    const firstCellLower = firstCell.toLowerCase();
    const secondCellLower = secondCell.toLowerCase();

    if (['total', 'postal', 'dqy', 'egk;kxs', 'mkys', 'page', 'grand total'].some(w => firstCellLower.includes(w) || secondCellLower.includes(w))) {
      continue;
    }

    let boothNumber = 0;
    let pollingStation = '';

    if (isTripletFormat) {
      // In Format B: Col 1 is Booth Number, Col 2 is Polling Station building address
      const b1 = typeof row[1] === 'number' ? row[1] : parseInt(row[1], 10);
      const b0 = typeof row[0] === 'number' ? row[0] : parseInt(row[0], 10);
      boothNumber = !isNaN(b1) && b1 > 0 ? b1 : (!isNaN(b0) && b0 > 0 ? b0 : 0);
      if (boothNumber <= 0) continue;

      const rawPs = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : '';
      pollingStation = rawPs && isNaN(Number(rawPs)) ? rawPs : `Booth #${boothNumber}`;
    } else {
      // In Format A: Col 0 is Booth S.No, Col 1 is Polling Station
      const psNumMatch = firstCell.match(/^\d+/);
      if (!psNumMatch) continue;
      boothNumber = parseInt(psNumMatch[0], 10);
      if (isNaN(boothNumber) || boothNumber <= 0) continue;

      const rawPs = secondCell;
      pollingStation = rawPs && isNaN(Number(rawPs)) ? rawPs : `Booth #${boothNumber}`;
    }

    const candidateVotes = [];
    let boothValidVotes = 0;

    for (const cand of candidateCols) {
      let votes = 0;
      if (cand.voteColIdx < row.length && row[cand.voteColIdx] !== null && row[cand.voteColIdx] !== undefined) {
        const parsedVal = Number(String(row[cand.voteColIdx]).replace(/,/g, '').trim());
        votes = !isNaN(parsedVal) && parsedVal >= 0 ? Math.round(parsedVal) : 0;
      }

      let candParty = cand.party || candidateAccumulator[cand.candidateName]?.party || '';
      if (cand.partyColIdx !== undefined && cand.partyColIdx < row.length && row[cand.partyColIdx]) {
        const pCell = String(row[cand.partyColIdx]).trim();
        if (pCell && isNaN(Number(pCell)) && !["''", '""', '"', "'", '-', '.', '—', 'null', 'undefined'].includes(pCell)) {
          candParty = normalizePartyName(pCell);
          cand.party = candParty;
        }
      }
      if (!candParty || ["''", '""', '"', "'", '-', '.', '—'].includes(candParty)) {
        candParty = getPartyForCandidate(cand.candidateName);
      }

      candidateVotes.push({
        candidate: cand.candidateName,
        party: candParty || 'IND',
        votes,
        voteShare: 0,
      });

      boothValidVotes += votes;
      if (candidateAccumulator[cand.candidateName]) {
        candidateAccumulator[cand.candidateName].votes += votes;
        if (candParty) candidateAccumulator[cand.candidateName].party = candParty;
      }
    }

    let nota = 0;
    if (notaColIdx !== -1 && notaColIdx < row.length) {
      const parsedNota = Number(String(row[notaColIdx] || '0').replace(/,/g, '').trim());
      nota = !isNaN(parsedNota) && parsedNota >= 0 ? Math.round(parsedNota) : 0;
    }

    let rejectedVotes = 0;
    if (rejectedColIdx !== -1 && rejectedColIdx < row.length) {
      const parsedRej = Number(String(row[rejectedColIdx] || '0').replace(/,/g, '').trim());
      rejectedVotes = !isNaN(parsedRej) && parsedRej >= 0 ? Math.round(parsedRej) : 0;
    }

    let totalVotes = boothValidVotes + nota;
    if (totalValidColIdx !== -1 && totalValidColIdx < row.length) {
      const parsedTot = Number(String(row[totalValidColIdx] || '0').replace(/,/g, '').trim());
      if (!isNaN(parsedTot) && parsedTot > 0 && parsedTot >= boothValidVotes) {
        totalVotes = Math.round(parsedTot);
      }
    }

    const sortedVotes = [...candidateVotes].sort((a, b) => b.votes - a.votes);
    const winnerCandidate = sortedVotes[0] || { candidate: '', party: '', votes: 0 };
    const runnerUpCandidate = sortedVotes[1] || { candidate: '', party: '', votes: 0 };

    const winningMargin = winnerCandidate.votes - runnerUpCandidate.votes;
    const winnerVoteShare = totalVotes > 0 ? Number(((winnerCandidate.votes / totalVotes) * 100).toFixed(2)) : 0;
    const runnerUpVoteShare = totalVotes > 0 ? Number(((runnerUpCandidate.votes / totalVotes) * 100).toFixed(2)) : 0;
    const marginPercent = totalVotes > 0 ? Number(((winningMargin / totalVotes) * 100).toFixed(2)) : 0;

    candidateVotes.forEach(cv => {
      cv.voteShare = totalVotes > 0 ? Number(((cv.votes / totalVotes) * 100).toFixed(2)) : 0;
    });

    let performanceCategory = 'neutral';
    if (winnerVoteShare >= thresholds.strong) {
      performanceCategory = 'strong';
    } else if (winnerVoteShare >= thresholds.medium) {
      performanceCategory = 'medium';
    } else if (winnerCandidate.votes > 0) {
      performanceCategory = 'weak';
    }

    if (winnerCandidate.candidate && candidateAccumulator[winnerCandidate.candidate]) {
      candidateAccumulator[winnerCandidate.candidate].boothsWon += 1;
    }

    booths.push({
      year: resolvedYear,
      district,
      assemblyConstituency: acName,
      acNo: acNo || 0,
      boothNumber,
      pollingStation,
      electors: 0,
      candidateVotes,
      validVotes: boothValidVotes,
      rejectedVotes,
      nota,
      tenderedVotes: 0,
      totalVotes,
      winner: {
        candidate: winnerCandidate.candidate,
        party: winnerCandidate.party || 'IND',
        votes: winnerCandidate.votes,
        voteShare: winnerVoteShare,
      },
      runnerUp: {
        candidate: runnerUpCandidate.candidate,
        party: runnerUpCandidate.party || 'IND',
        votes: runnerUpCandidate.votes,
        voteShare: runnerUpVoteShare,
      },
      winningMargin,
      winningMarginPercent: marginPercent,
      performanceCategory,
      sourceFile: originalFileName,
      sourceRow: r + 1,
    });

    fileTotalVotes += totalVotes;
    fileValidVotes += boothValidVotes;
    fileNotaVotes += nota;
  }

  // Constituency summary
  const candidateTotals = Object.values(candidateAccumulator).map(c => ({
    ...c,
    voteShare: fileTotalVotes > 0 ? Number(((c.votes / fileTotalVotes) * 100).toFixed(2)) : 0,
  })).sort((a, b) => b.votes - a.votes);

  const constWinner = candidateTotals[0] || { candidate: '', party: '', votes: 0, voteShare: 0 };
  const constRunnerUp = candidateTotals[1] || { candidate: '', party: '', votes: 0, voteShare: 0 };
  const constMargin = constWinner.votes - constRunnerUp.votes;
  const constMarginPercent = fileTotalVotes > 0 ? Number(((constMargin / fileTotalVotes) * 100).toFixed(2)) : 0;

  return {
    meta: {
      year: resolvedYear,
      district,
      acName,
      acNo,
      electors,
      sourcePdf,
      originalFileName,
      totalRows: rows.length,
      totalBooths: booths.length,
      totalVotes: fileTotalVotes,
      totalValidVotes: fileValidVotes,
      totalNota: fileNotaVotes,
      candidates: candidateCols.map(c => c.candidateName),
    },
    constituencySummary: {
      year: resolvedYear,
      acNo: acNo || 0,
      acName,
      district,
      totalBooths: booths.length,
      totalElectors: electors,
      totalVotes: fileTotalVotes,
      totalValidVotes: fileValidVotes,
      nota: fileNotaVotes,
      candidateTotals,
      winner: constWinner,
      runnerUp: constRunnerUp,
      winningMargin: constMargin,
      winningMarginPercent: constMarginPercent,
    },
    booths,
  };
}
