const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function testTransferDebtFlow() {
    try {
        console.log("=================================================");
        console.log("🚀 THỬ NGHIỆM CHUYỂN LỚP VÀ CÔNG NỢ NỐI TIẾP (TRANSFERS)");
        console.log("=================================================");

        // 1. Get sample student HS00001
        const studentsRes = await fetch(`${SUPABASE_URL}/rest/v1/students?student_code=eq.HS00001&select=student_id,student_code,full_name`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const [student] = await studentsRes.json();

        // 2. Fetch 2 classes
        const classesRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=class_id,class_name&limit=2`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const [classFrom, classTo] = await classesRes.json();

        console.log(`Học sinh: ${student.full_name} (${student.student_code})`);
        console.log(`Chuyển từ: ${classFrom.class_name} ➔ Sang: ${classTo.class_name}`);

        // 3. Insert enrollment for classFrom (TRANSFERRED) and classTo (ACTIVE)
        await fetch(`${SUPABASE_URL}/rest/v1/enrollments`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify([
                { student_id: student.student_id, class_id: classFrom.class_id, status: 'TRANSFERRED' },
                { student_id: student.student_id, class_id: classTo.class_id, status: 'ACTIVE' }
            ])
        });

        // 4. Record Class Transfer Audit
        await fetch(`${SUPABASE_URL}/rest/v1/class_transfers`, {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify([{
                student_id: student.student_id,
                from_class_id: classFrom.class_id,
                to_class_id: classTo.class_id,
                effective_batch_number: 3,
                reason: 'Xin chuyển sang lớp 7B học cùng bạn'
            }])
        });

        console.log("✅ Đã tạo bản ghi chuyển lớp mẫu và cập nhật enrollment status = TRANSFERRED.");

        // 5. Query v_debt_summary for this student
        const debtRes = await fetch(`${SUPABASE_URL}/rest/v1/v_debt_summary?student_id=eq.${student.student_id}&select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const debtRows = await debtRes.json();

        console.log(`\n📋 Kết quả Báo cáo Công Nợ Nối Tiếp (v_debt_summary):`);
        console.log(`   Tìm thấy ${debtRows.length} đợt công nợ tổng hợp (bao gồm cả lớp cũ và lớp mới).`);

        const classMap = {};
        debtRows.forEach(r => {
            classMap[r.class_name] = (classMap[r.class_name] || 0) + 1;
        });

        Object.keys(classMap).forEach(cName => {
            console.log(`   • Lớp '${cName}': ${classMap[cName]} đợt công nợ ghi nhận.`);
        });

        console.log("=================================================");
    } catch (err) {
        console.error("Lỗi test:", err);
    }
}

testTransferDebtFlow();
