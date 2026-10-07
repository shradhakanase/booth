import * as XLSX from 'xlsx';
import fs from 'fs';

const buffer = fs.readFileSync('C:\\Users\\omkar\\Downloads\\data\\2019\\Varanasi\\384.xls');
const wb = XLSX.read(buffer, { type: 'buffer' });
const s = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(s, { header: 1, defval: null });

console.log('Row 3:');
(rows[3] || []).forEach((v, i) => { if (v) console.log(`  [${i}]: ${JSON.stringify(v)}`); });

console.log('\nRow 4:');
(rows[4] || []).forEach((v, i) => { if (v) console.log(`  [${i}]: ${JSON.stringify(v)}`); });
