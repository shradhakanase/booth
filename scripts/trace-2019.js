import * as XLSX from 'xlsx';
import fs from 'fs';

const buffer = fs.readFileSync('C:\\Users\\omkar\\Downloads\\data\\2019\\Varanasi\\384.xls');
const wb = XLSX.read(buffer, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: null });

const candNameRow = rows[3];
const subHeaderRow = rows[4];

console.log('subHeaderRow length:', subHeaderRow.length);
for (let c = 0; c < subHeaderRow.length; c++) {
  const sub = String(subHeaderRow[c] || '').trim().toLowerCase();
  console.log(`c=${c}, sub="${sub}"`);
  if (sub.includes('secured')) {
    console.log(`  --> Matched secured at c=${c}! Searching back...`);
    for (let back = c; back >= Math.max(0, c - 2); back--) {
      const val = candNameRow[back];
      console.log(`    back=${back}, val=${JSON.stringify(val)}`);
    }
  }
}
