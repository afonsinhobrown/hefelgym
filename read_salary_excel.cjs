
const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, 'SALARIO HEFEL JANEIRO 2026 para inclusao no sistema.xlsx');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log('--- ROWS 50 to 100 ---');
    rawData.slice(50, 100).forEach((row, i) => {
        if (row.length > 0) console.log(`Row ${i + 50}:`, JSON.stringify(row));
    });

} catch (error) {
    console.error('Error reading excel file:', error.message);
}
