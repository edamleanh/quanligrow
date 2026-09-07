const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function verifyStatus() {
    console.log("=================================================");
    console.log("🔍 KIỂM TRA TRẠNG THÁI HỌC SINH (DANG_HOC, DA_NGHI, DA_TN)");
    console.log("=================================================");

    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?select=status,grade`, {
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`
        }
    });

    const data = await res.json();
    if (Array.isArray(data)) {
        const statusMap = {};
        data.forEach(s => {
            statusMap[s.status] = (statusMap[s.status] || 0) + 1;
        });

        console.log("Thống kê trạng thái học sinh trong CSDL mới:");
        Object.keys(statusMap).forEach(st => {
            console.log(`  • Trạng thái ${st}: ${statusMap[st]} học sinh`);
        });
    }

    console.log("=================================================");
}

verifyStatus().catch(console.error);
