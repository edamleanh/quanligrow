const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function verifyFeeRates() {
    try {
        const classesRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=class_name,default_fee_rate,subjects(subject_name)`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const classes = await classesRes.json();

        console.log("=================================================");
        console.log("🚀 BÁO CÁO HỌC PHÍ MẶC ĐỊNH LỚP HỌC TRÊN SUPABASE");
        console.log("=================================================");

        const feeDistribution = {};
        classes.forEach(c => {
            const feeStr = `${Number(c.default_fee_rate).toLocaleString('vi-VN')} VNĐ`;
            feeDistribution[feeStr] = (feeDistribution[feeStr] || 0) + 1;
        });

        console.log("1. Phân bổ Học phí mặc định theo Số lớp:");
        Object.keys(feeDistribution).forEach(fee => {
            console.log(`   • Mức phí ${fee}: ${feeDistribution[fee]} lớp`);
        });

        console.log("\n2. Mẫu 5 lớp học đại diện:");
        classes.slice(0, 5).forEach(c => {
            console.log(`   - ${c.class_name} | Môn: ${c.subjects ? c.subjects.subject_name : '---'} | Học phí mặc định: ${Number(c.default_fee_rate).toLocaleString('vi-VN')} VNĐ`);
        });

        console.log("=================================================");
    } catch (err) {
        console.error("Lỗi kiểm tra học phí:", err);
    }
}

verifyFeeRates();
