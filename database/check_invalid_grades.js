const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function checkGrades() {
    console.log("=================================================");
    console.log("🔍 KIỂM TRA KHỐI LỚP BẤT THƯỜNG TRÊN TOÀN CSDL");
    console.log("=================================================");

    // 1. Check original ds_tong table
    const backupPath = path.join(__dirname, 'backups', 'ds_tong_backup.json');
    if (fs.existsSync(backupPath)) {
        const rawData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
        const distinctLop = new Set();
        const nonStandardRows = [];

        rawData.forEach(row => {
            const lopVal = row['LỚP'];
            distinctLop.add(String(lopVal).trim());

            const lopNum = parseInt(lopVal, 10);
            if (isNaN(lopNum) || lopNum < 1 || lopNum > 12) {
                // Ignore system config row 99999
                if (row['STT'] !== 99999 && row['STT'] !== '99999') {
                    nonStandardRows.push(row);
                }
            }
        });

        console.log("1. Tất cả giá trị cột 'LỚP' xuất hiện trong ds_tong gốc:");
        console.log("  ", Array.from(distinctLop).sort((a,b) => a.localeCompare(b, undefined, {numeric:true})));

        if (nonStandardRows.length > 0) {
            console.log(`\n⚠️ Phát hiện ${nonStandardRows.length} dòng có giá trị 'LỚP' không nằm trong dải 1-12:`);
            nonStandardRows.forEach(r => {
                console.log(`  - STT ${r['STT']}: Họ tên "${r['HỌ']} ${r['TÊN']}" | Giá trị LỚP: "${r['LỚP']}"`);
            });
        } else {
            console.log("\n✅ Không có dòng dữ liệu học sinh nào có khối ngoài dải 1-12 trong ds_tong!");
        }
    }

    // 2. Check students table on Supabase
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?select=grade`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const studentData = await res.json();
    if (Array.isArray(studentData)) {
        const studentGrades = new Set(studentData.map(s => s.grade));
        console.log("\n2. Tất cả giá trị cột 'grade' trong bảng 'students' 3NF:");
        console.log("  ", Array.from(studentGrades).sort((a,b) => a - b));

        const invalidGrades = Array.from(studentGrades).filter(g => g < 1 || g > 12);
        if (invalidGrades.length > 0) {
            console.log(`\n❌ Phát hiện khối ngoài 1-12 trong bảng students:`, invalidGrades);
        } else {
            console.log("\n✅ Bảng 'students' 3NF tuân thủ 100% ràng buộc CHECK (grade BETWEEN 1 AND 12)!");
        }
    }

    console.log("=================================================");
}

checkGrades().catch(console.error);
