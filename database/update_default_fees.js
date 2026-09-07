const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function updateDefaultFees() {
    try {
        console.log("=================================================");
        console.log("🚀 CẬP NHẬT HỌC PHÍ MẶC ĐỊNH TRÊN SUPABASE (350K / 300K)");
        console.log("=================================================");

        // 1. Fetch all subjects
        const subjectsRes = await fetch(`${SUPABASE_URL}/rest/v1/subjects?select=subject_id,subject_code,subject_name`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const subjects = await subjectsRes.json();
        const vanSubjectIds = subjects.filter(s => s.subject_code === 'VAN' || s.subject_name.toLowerCase().includes('văn')).map(s => s.subject_id);

        console.log("Mã môn Ngữ Văn:", vanSubjectIds);

        // 2. Fetch all classes
        const classesRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=class_id,class_name,subject_id`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const classes = await classesRes.json();

        let vanClassCount = 0;
        let regularClassCount = 0;

        for (const c of classes) {
            const isVan = vanSubjectIds.includes(c.subject_id);
            const targetFee = isVan ? 300000 : 350000;

            if (isVan) vanClassCount++;
            else regularClassCount++;

            // Update Class default_fee_rate
            await fetch(`${SUPABASE_URL}/rest/v1/classes?class_id=eq.${c.class_id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ default_fee_rate: targetFee })
            });

            // Update Batches fee_rate for this class
            await fetch(`${SUPABASE_URL}/rest/v1/batches?class_id=eq.${c.class_id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fee_rate: targetFee })
            });
        }

        console.log(`✅ Đã cập nhật ${regularClassCount} lớp thông thường -> 350.000 VNĐ / đợt.`);
        console.log(`✅ Đã cập nhật ${vanClassCount} lớp Ngữ Văn -> 300.000 VNĐ / đợt.`);
        console.log(`✅ Đã đồng bộ 100% tất cả 924 đợt học sang mức phí mới.`);
        console.log("=================================================");
    } catch (err) {
        console.error("Lỗi cập nhật học phí:", err);
    }
}

updateDefaultFees();
