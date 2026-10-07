import * as XLSX from 'xlsx';
import fs from 'fs';

function testParse(filePath) {
  console.log(`\n==============================================`);
  console.log(`TESTING PARSER ON: ${filePath}`);
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  // Let's inspect rows 0 to 7
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    console.log(`Row ${r}:`, JSON.stringify(rows[r]?.slice(0, 18)));
  }
}

testParse('C:\\Users\\omkar\\Downloads\\data\\2017\\Varanasi\\387.xls');
testParse('C:\\Users\\omkar\\Downloads\\data\\2019\\Varanasi\\384.xls');
testParse('C:\\Users\\omkar\\Downloads\\data\\2022\\Varanasi\\AC384.xls');
testParse('C:\\Users\\omkar\\Downloads\\data\\2022\\Agra\\AC86.xls');
testParse('C:\\Users\\omkar\\Downloads\\data\\2024\\Varanasi\\384.xlsx');
