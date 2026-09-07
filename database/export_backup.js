const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

async function fetchTableData(tableName) {
    let allData = [];
    let start = 0;
    const limit = 1000;

    console.log(`[BACKUP] Đang tải dữ liệu từ bảng '${tableName}'...`);

    while (true) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Range': `${start}-${start + limit - 1}`,
                'Range-Unit': 'items'
            }
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error(`[ERROR] Không thể lấy bảng '${tableName}':`, errText);
            return null;
        }

        const data = await response.json();
        if (data && data.length > 0) {
            allData = allData.concat(data);
            console.log(`  -> Đã tải ${allData.length} dòng...`);
            if (data.length < limit) break;
            start += limit;
        } else {
            break;
        }
    }

    return allData;
}

function convertToCSV(items) {
    if (!items || items.length === 0) return '';
    const headers = Object.keys(items[0]);
    const csvRows = [];
    csvRows.push(headers.join(','));

    for (const item of items) {
        const values = headers.map(header => {
            const val = item[header] === null || item[header] === undefined ? '' : String(item[header]);
            const escaped = val.replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
}

async function main() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    console.log(`=================================================`);
    console.log(`🚀 KHỞI CHẠY BACKUP DỮ LIỆU SUPABASE (${timestamp})`);
    console.log(`=================================================`);

    const tablesToBackup = ['ds_tong', 'subjects', 'teachers', 'students', 'classes', 'enrollments', 'batches', 'receipts', 'receipt_items'];
    const backupSummary = {};

    for (const table of tablesToBackup) {
        const data = await fetchTableData(table);
        if (data && data.length > 0) {
            backupSummary[table] = data.length;

            // Save JSON backup
            const jsonPath = path.join(backupDir, `${table}_backup.json`);
            fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), 'utf8');

            // Save CSV backup
            const csvPath = path.join(backupDir, `${table}_backup.csv`);
            fs.writeFileSync(csvPath, convertToCSV(data), 'utf8');

            console.log(`✅ [SUCCESS] Bảng '${table}': Đã lưu ${data.length} bản ghi -> ${jsonPath}`);
        } else if (data && data.length === 0) {
            console.log(`ℹ️ [INFO] Bảng '${table}': Trống (0 bản ghi).`);
        }
    }

    // Full System Dump Manifest
    const manifestPath = path.join(backupDir, 'backup_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify({
        exported_at: new Date().toISOString(),
        supabase_url: SUPABASE_URL,
        tables: backupSummary
    }, null, 2), 'utf8');

    console.log(`=================================================`);
    console.log(`🎉 HOÀN THÀNH BACKUP TOÀN BỘ DỮ LIỆU THÀNH CÔNG!`);
    console.log(`📁 Thư mục lưu trữ: ${backupDir}`);
    console.log(`=================================================`);
}

main().catch(console.error);
