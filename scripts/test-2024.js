import * as XLSX from 'xlsx';
import fs from 'fs';

function test2024(filePath) {
  console.log(`\n==============================================`);
  console.log(`TESTING 2024: ${filePath}`);
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  for (let r = 0; r < Math.min(10, rows.length); r++) {
    console.log(`Row ${r}:`, JSON.stringify(rows[r]?.slice(0, 15)));
  }
}

test2024('C:\\Users\\omkar\\Downloads\\data\\2024\\Varanasi\\2025022828.xlsx');
test2024('C:\\Users\\omkar\\Downloads\\data\\2024\\Varanasi\\2024091311-1.REVIEW.xlsx');
test2024('C:\\Users\\omkar\\Downloads\\data\\2024\\Agra\\2024090518-1.REVIEW.xlsx');
