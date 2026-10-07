import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getPartyForCandidate, normalizePartyName, cleanCandidateName } from '../lib/partyMapping.js';

export function selectBestSheet(workbook) {
  let bestSheetName = workbook.SheetNames[0];
  let bestScore = -999999;
  let bestRows = [];

  for (const sName of workbook.SheetNames) {
    const s = workbook.Sheets[sName];
    if (!s) continue;
    const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: null });
    const nonEmpty = (rows || []).filter(r => r && r.some(c => c !== null && c !== undefined && String(c).trim() !== ''));
    if (nonEmpty.length < 5) continue;

    const nameLower = sName.toLowerCase();
    let score = nonEmpty.length;
    
    if (/^form\s*20$/i.test(nameLower) || /^praroop\s*20$/i.test(nameLower)) score += 15000;
    else if (nameLower.includes('final 20') || nameLower.includes('form 20') || nameLower.includes('form20')) score += 10000;
    else if (nameLower.includes('all data') || nameLower.includes('english') || nameLower.includes('eng')) score += 8000;
    else if (nameLower.startsWith('ac-') || nameLower.startsWith('ac')) score += 3000;
    else if (nameLower.includes('p-20') || nameLower.includes('praroop')) score += 2000;

    if (/^r\d+$/i.test(nameLower) || nameLower.includes('round') || nameLower.includes('tally') || nameLower.includes('pb') || nameLower.includes('constiuence')) {
      score -= 20000;
    }

    let positiveNumbers = 0;
    let maxWidth = 0;
    for (const row of nonEmpty.slice(0, 35)) {
      if (row && row.length > maxWidth) maxWidth = row.length;
      for (const cell of (row || [])) {
        if (typeof cell === 'number' && cell > 0) positiveNumbers++;
        else if (typeof cell === 'string' && /^\d+$/.test(cell.trim()) && Number(cell.trim()) > 0) positiveNumbers++;
      }
    }

    if (maxWidth >= 10) score += 4000; else score -= 5000;
    if (positiveNumbers > 100) score += 5000;
    else if (positiveNumbers > 20) score += 2000;
    else score -= 3000;

    if (score > bestScore) {
      bestScore = score;
      bestSheetName = sName;
      bestRows = rows;
    }
  }

  if (bestRows.length === 0) {
    const defaultSheet = workbook.Sheets[bestSheetName];
    bestRows = defaultSheet ? XLSX.utils.sheet_to_json(defaultSheet, { header: 1, defval: null }) : [];
  }

  return { sheetName: bestSheetName, rows: bestRows };
}

export function cleanSheetRows(rawRows) {
  const cleaned = [];
  for (const r of rawRows || []) {
    if (!r || !r.length) continue;
    let lastIdx = r.length - 1;
    while (lastIdx >= 0 && (r[lastIdx] === null || r[lastIdx] === undefined || String(r[lastIdx]).trim() === '')) {
      lastIdx--;
    }
    if (lastIdx >= 0) {
      cleaned.push(r.slice(0, lastIdx + 1));
    }
  }
  return cleaned;
}

export function extractForm20Data(rows, originalFileName, districtHint = '', thresholds = { strong: 50, medium: 30 }, year = 2024) {
  if (!rows || rows.length < 5) {
    throw new Error('File has insufficient rows for a valid Form 20 sheet.');
  }

  // 1. Detect Metadata
  let district = districtHint ? districtHint.trim() : '';
  let acName = '';
  let acNo = null;
  let electors = 0;
  let sourcePdf = originalFileName;
  let detectedYear = null;

  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const row = rows[r] || [];
    const fullRowStr = row.filter(Boolean).map(String).join(' ');

    if (!detectedYear) {
      const yearMatch = fullRowStr.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) {
        const yVal = parseInt(yearMatch[1], 10);
        if (yVal >= 1950 && yVal <= 2050) detectedYear = yVal;
      }
    }

    if (!district) {
      const distMatch = fullRowStr.match(/District\s*[-–:]\s*([A-Za-z\s]+)/i);
      if (distMatch && !distMatch[1].includes('____')) {
        district = distMatch[1].trim();
      }
    }

    if (fullRowStr.includes('Assembly') || fullRowStr.includes('segment') || fullRowStr.includes('Constituency') || fullRowStr.includes('AC No.') || fullRowStr.includes('fo/kku')) {
      const acMatch = fullRowStr.match(/(\d+)\s*[-–&]\s*([A-Za-z0-9\s.()]+)/);
      if (acMatch) {
        acNo = parseInt(acMatch[1], 10);
        acName = acMatch[2].replace(/Assembly Election|Assembly Constituency|segment|____+|fo\/kku|fuokZpu/gi, '').trim();
      }
    }

    if (fullRowStr.includes('Electors') || fullRowStr.includes('electors') || fullRowStr.includes('fuokZpd')) {
      const elecMatch = fullRowStr.match(/(\d{4,})/);
      if (elecMatch) {
        electors = parseInt(elecMatch[1], 10) || 0;
      }
    }
  }

  let resolvedYear = (year && year !== 'auto' && Number(year) > 0) ? Number(year) : (detectedYear || null);
  if (!resolvedYear) {
    const fileYearMatch = originalFileName.match(/\b(19\d{2}|20\d{2})\b/);
    if (fileYearMatch) resolvedYear = parseInt(fileYearMatch[1], 10);
  }
  if (!resolvedYear) resolvedYear = 2024;

  if (!district || district.includes('____')) district = districtHint || 'General';
  if (!acName) {
    const baseName = originalFileName.replace(/\.[^/.]+$/, '').replace(/^AC/i, '');
    acName = `AC-${baseName}`;
  }

  // 2. Identify Table Format Type
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
    const subHeaderRow = rows[subHeaderRowIdx] || [];
    for (let c = 0; c < subHeaderRow.length; c++) {
      const sub = String(subHeaderRow[c] || '').trim().toLowerCase();
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

  // 3. Process Booth Rows
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
      const b1 = typeof row[1] === 'number' ? row[1] : parseInt(row[1], 10);
      const b0 = typeof row[0] === 'number' ? row[0] : parseInt(row[0], 10);
      boothNumber = !isNaN(b1) && b1 > 0 ? b1 : (!isNaN(b0) && b0 > 0 ? b0 : 0);
      if (boothNumber <= 0) continue;

      const rawPs = row[2] !== null && row[2] !== undefined ? String(row[2]).trim() : '';
      pollingStation = rawPs && isNaN(Number(rawPs)) ? rawPs : `Booth #${boothNumber}`;
    } else {
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

    // Skip trailing empty padding rows
    if (boothValidVotes === 0 && nota === 0 && boothNumber === 0) continue;

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

// Test on all 6 Unnao files
const dir = 'C:/Users/omkar/Downloads/data/2017/Unnao';
for (const f of ['162.xls', '163.xls', '164.xls', '165.xls', '166.xls', '167.xls']) {
  const filePath = path.join(dir, f);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    continue;
  }
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  const { rows } = selectBestSheet(wb);
  const cleaned = cleanSheetRows(rows);
  const res = extractForm20Data(cleaned, f, 'Unnao', { strong: 50, medium: 30 }, 2017);
  console.log('=== FILE:', f, '===');
  console.log('  AC:', res.meta.acNo, res.meta.acName, 'Booths:', res.meta.totalBooths, 'Total Votes:', res.meta.totalVotes, 'NOTA:', res.meta.totalNota);
  console.log('  Winner:', res.constituencySummary.winner.candidate, '(' + res.constituencySummary.winner.party + ')', 'Votes:', res.constituencySummary.winner.votes, 'Margin:', res.constituencySummary.winningMargin);
  console.log('  Runner up:', res.constituencySummary.runnerUp.candidate, '(' + res.constituencySummary.runnerUp.party + ')', 'Votes:', res.constituencySummary.runnerUp.votes);
}
