const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'backups', 'ds_tong_backup.json');
const rawData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

const graduatedRows = [];
rawData.forEach(row => {
    const lop = String(row['LỚP'] || '').trim().toUpperCase();
    const notes = String(row['Ghi chú'] || '').trim().toUpperCase();

    if (lop.includes('12N') || lop.includes('TN') || notes.includes('TỐT NGHIỆP') || notes.includes('TN')) {
        graduatedRows.push(row);
    }
});

console.log(`[ANALYSIS] Tìm thấy ${graduatedRows.length} học sinh có dấu hiệu Đã tốt nghiệp (12N26 / TN):`);
graduatedRows.forEach(r => {
    console.log(`  - STT ${r['STT']}: ${r['HỌ']} ${r['TÊN']} | LỚP: "${r['LỚP']}" | Ghi chú: "${r['Ghi chú']}"`);
});
