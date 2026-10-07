import * as XLSX from 'xlsx';

/**
 * Select the best Form-20 / Final result sheet from a workbook
 */
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
    
    // Explicit Form-20 / Final result sheet name boosts
    if (/^form\s*20$/i.test(nameLower) || /^praroop\s*20$/i.test(nameLower)) score += 15000;
    else if (nameLower.includes('final 20') || nameLower.includes('form 20') || nameLower.includes('form20')) score += 10000;
    else if (nameLower.includes('all data') || nameLower.includes('english') || nameLower.includes('eng')) score += 8000;
    else if (nameLower.startsWith('ac-') || nameLower.startsWith('ac')) score += 3000;
    else if (nameLower.includes('p-20') || nameLower.includes('praroop')) score += 2000;

    // Heavy penalty for individual counting round sub-sheets (R1, R2, ..., R54, Round 1...)
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

/**
 * Trim empty rows and trailing empty columns to optimize payload
 */
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
