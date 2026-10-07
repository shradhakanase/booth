import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

function checkFormat(filePath) {
  console.log(`\n======================================================`);
  console.log(`FILE: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.log('Not found!');
    return;
  }
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
  
  console.log(`Total rows: ${rows.length}, Total cols in row 0: ${rows[0]?.length}`);
  for (let r = 0; r < Math.min(8, rows.length); r++) {
    const nonNulls = (rows[r] || []).map((v, c) => v !== null && v !== undefined && v !== '' ? `[c${c}]: ${v}` : null).filter(Boolean);
    console.log(`Row ${r}:`, nonNulls.slice(0, 10).join(' | '));
  }
  
  // Check row 6 or 7 data row
  for (let r = 5; r < Math.min(9, rows.length); r++) {
    const isData = rows[r] && typeof rows[r][0] === 'number' && typeof rows[r][1] === 'number';
    if (isData) {
      console.log(`--> First Data Row at index ${r}:`, JSON.stringify(rows[r].slice(0, 20)));
      break;
    }
  }
}

// 2024 format
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2024\\Varanasi\\384.xlsx');
if (!fs.existsSync('C:\\Users\\omkar\\Downloads\\data\\2024\\Varanasi\\384.xlsx')) {
  const f2024 = fs.readdirSync('C:\\Users\\omkar\\Downloads\\data\\2024\\Varanasi')[0];
  checkFormat(`C:\\Users\\omkar\\Downloads\\data\\2024\\Varanasi\\${f2024}`);
}

// 2022 formats
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2022\\Varanasi\\AC384.xls');
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2022\\Agra\\AC86.xls');

// 2019 formats
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2019\\Varanasi\\384.xls');
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2019\\agra\\86.xls');

// 2017 formats
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2017\\Varanasi\\384.xls');
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2017\\Varanasi\\387.xls');
checkFormat('C:\\Users\\omkar\\Downloads\\data\\2017\\Agra\\86.xls');
