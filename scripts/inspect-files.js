import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

function inspectFileDetailed(filePath) {
  console.log(`\n==============================================`);
  console.log(`INSPECTING FILE: ${filePath}`);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  console.log(`Sheets in workbook:`, workbook.SheetNames);
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });
    console.log(`\n--- Sheet: "${sheetName}" (Total rows: ${rows.length}) ---`);
    for (let i = 0; i < Math.min(10, rows.length); i++) {
      console.log(`Row ${i}:`, JSON.stringify(rows[i]));
    }
  }
}

// 2017 Varanasi
inspectFileDetailed('C:\\Users\\omkar\\Downloads\\data\\2017\\Varanasi\\387.xls');
inspectFileDetailed('C:\\Users\\omkar\\Downloads\\data\\2017\\Varanasi\\388.xls');

// Let's check files in 2022 and 2019
function listDirFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir);
}

console.log('\n2022 Varanasi files:', listDirFiles('C:\\Users\\omkar\\Downloads\\data\\2022\\Varanasi'));
console.log('2019 Varanasi files:', listDirFiles('C:\\Users\\omkar\\Downloads\\data\\2019\\Varanasi'));
console.log('2022 Agra files:', listDirFiles('C:\\Users\\omkar\\Downloads\\data\\2022\\Agra'));
console.log('2019 Agra files:', listDirFiles('C:\\Users\\omkar\\Downloads\\data\\2019\\agra'));

const v2022Files = listDirFiles('C:\\Users\\omkar\\Downloads\\data\\2022\\Varanasi');
if (v2022Files.length > 0) {
  inspectFileDetailed(`C:\\Users\\omkar\\Downloads\\data\\2022\\Varanasi\\${v2022Files[0]}`);
}
const v2019Files = listDirFiles('C:\\Users\\omkar\\Downloads\\data\\2019\\Varanasi');
if (v2019Files.length > 0) {
  inspectFileDetailed(`C:\\Users\\omkar\\Downloads\\data\\2019\\Varanasi\\${v2019Files[0]}`);
}
