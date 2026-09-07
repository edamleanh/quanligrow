const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function verifyAllStudents() {
    let allData = [];
    let start = 0;
    const limit = 1000;

    while (true) {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/students?select=student_code,full_name,grade,status`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Range': `${start}-${start + limit - 1}`,
                'Range-Unit': 'items'
            }
        });

        const data = await res.json();
        if (data && data.length > 0) {
            allData = allData.concat(data);
            if (data.length < limit) break;
            start += limit;
        } else {
            break;
        }
    }

    console.log("=================================================");
    console.log(`🚀 BÁO CÁO TỔNG THỂ CSDL HỌC SINH 3NF (${allData.length} HỌC SINH)`);
    console.log("=================================================");

    const statusMap = {};
    const graduatedList = [];

    allData.forEach(s => {
        statusMap[s.status] = (statusMap[s.status] || 0) + 1;
        if (s.status === 'DA_TN') {
            graduatedList.push(s);
        }
    });

    console.log("1. Phân bổ theo Trạng thái Học sinh:");
    Object.keys(statusMap).forEach(st => {
        console.log(`  • Trạng thái '${st}': ${statusMap[st]} học sinh`);
    });

    console.log(`\n2. Mẫu học sinh Đã Tốt Nghiệp ('DA_TN') (Tổng số: ${graduatedList.length}):`);
    graduatedList.slice(0, 5).forEach(s => {
        console.log(`  - ${s.student_code}: ${s.full_name} | Khối ${s.grade} | Trạng thái: ${s.status}`);
    });
    graduatedList.slice(-5).forEach(s => {
        console.log(`  - ${s.student_code}: ${s.full_name} | Khối ${s.grade} | Trạng thái: ${s.status}`);
    });

    console.log("=================================================");
}

verifyAllStudents().catch(console.error);
