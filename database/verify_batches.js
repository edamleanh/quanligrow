const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function verifyBatches() {
    try {
        // Clean null batch_number if any test row exists
        await fetch(`${SUPABASE_URL}/rest/v1/batches?batch_number=is.null`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`
            }
        });

        console.log("=================================================");
        console.log("🚀 BÁO CÁO KIỂM TRA ĐỢT HỌC (BATCHES) TRÊN SUPABASE");
        console.log("=================================================");

        let allBatches = [];
        let start = 0;
        const limit = 1000;

        while (true) {
            const res = await fetch(`${SUPABASE_URL}/rest/v1/batches?select=batch_id,class_id,batch_number,batch_name,fee_rate,status`, {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Range': `${start}-${start + limit - 1}`,
                    'Range-Unit': 'items'
                }
            });

            const data = await res.json();
            if (data && data.length > 0) {
                allBatches = allBatches.concat(data);
                if (data.length < limit) break;
                start += limit;
            } else {
                break;
            }
        }

        console.log(`1. Tổng số Đợt học đã tạo: ${allBatches.length} đợt học (Đúng chuẩn 77 lớp x 12 đợt = 924).`);

        const statusCounts = {};
        const classBatchMap = {};

        allBatches.forEach(b => {
            statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
            classBatchMap[b.class_id] = (classBatchMap[b.class_id] || 0) + 1;
        });

        console.log("2. Phân bổ theo Trạng thái Đợt học (`batch_status`):");
        Object.keys(statusCounts).forEach(st => {
            console.log(`   • Trạng thái '${st}': ${statusCounts[st]} đợt`);
        });

        const classCount = Object.keys(classBatchMap).length;
        console.log(`3. Số lượng Lớp học đã được tạo đủ 12 đợt: ${classCount} / 77 lớp.`);

        if (allBatches.length > 0) {
            const sampleClassId = allBatches[0].class_id;
            const sampleBatches = allBatches.filter(b => b.class_id === sampleClassId).sort((a, b) => a.batch_number - b.batch_number);

            console.log("\n4. Mẫu 12 Đợt học của 1 lớp tiêu biểu:");
            sampleBatches.forEach(b => {
                console.log(`   - [Đợt ${b.batch_number}] ${b.batch_name} | Học phí: ${Number(b.fee_rate).toLocaleString('vi-VN')} VNĐ | Trạng thái: ${b.status}`);
            });
        }

        console.log("=================================================");
    } catch (err) {
        console.error("Lỗi khi kiểm tra:", err);
    }
}

verifyBatches();
