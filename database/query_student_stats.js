const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function checkStudentStats() {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?select=student_code,full_name,grade,phone&order=student_code.asc&limit=1000`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await res.json();
    console.log("=================================================");
    console.log("📊 PHÂN TÍCH MÃ HỌC SINH VÀ KHỐI LỚP TRÊN CSDL");
    console.log("=================================================");
    
    if (!data || data.length === 0) {
        console.log("Không có dữ liệu.");
        return;
    }

    // Sample student codes
    console.log("Mẫu Mã Học Sinh (5 học sinh đầu tiên):");
    data.slice(0, 5).forEach(s => console.log(`  - ${s.student_code}: ${s.full_name} (Khối ${s.grade})`));

    console.log("Mẫu Mã Học Sinh (5 học sinh cuối danh sách):");
    data.slice(-5).forEach(s => console.log(`  - ${s.student_code}: ${s.full_name} (Khối ${s.grade})`));

    // Grade breakdown
    const grades = {};
    data.forEach(s => {
        grades[s.grade] = (grades[s.grade] || 0) + 1;
    });

    console.log("\nPhân bổ Học Sinh theo Khối Lớp:");
    const sortedGrades = Object.keys(grades).map(Number).sort((a,b)=>a-b);
    sortedGrades.forEach(g => {
        console.log(`  • Khối ${g}: ${grades[g]} học sinh`);
    });

    console.log(`\n-> Khối thấp nhất: Khối ${Math.min(...sortedGrades)}`);
    console.log(`-> Khối cao nhất: Khối ${Math.max(...sortedGrades)}`);
    console.log("=================================================");
}

checkStudentStats().catch(console.error);
