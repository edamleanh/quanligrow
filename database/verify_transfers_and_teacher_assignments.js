const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function verifyNewSchema() {
    try {
        console.log("=================================================");
        console.log("🚀 BÁO CÁO KIỂM TRA SCHEMA MỚI: CHUYỂN LỚP & GIÁO VIÊN THEO ĐỢT");
        console.log("=================================================");

        // 1. Fetch Students
        const studentsRes = await fetch(`${SUPABASE_URL}/rest/v1/students?select=student_id,student_code,full_name&limit=1`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const [student] = await studentsRes.json();

        // 2. Fetch 2 classes for transfer test
        const classesRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=class_id,class_name&limit=2`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const [classA, classB] = await classesRes.json();

        console.log(`1. Test Chuyển Lớp: Học sinh ${student.full_name} (${student.student_code})`);
        console.log(`   • Lớp đi (from_class): ${classA.class_name}`);
        console.log(`   • Lớp đến (to_class): ${classB.class_name}`);

        // Try querying class_transfers table
        const transfersRes = await fetch(`${SUPABASE_URL}/rest/v1/class_transfers?select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        if (transfersRes.ok) {
            const transfers = await transfersRes.json();
            console.log(`2. Bảng 'class_transfers' đã hoạt động trên Supabase! Số bản ghi hiện có: ${transfers.length}`);
        } else {
            console.log(`ℹ️ Bảng 'class_transfers' cần được chạy DDL từ 'database/migration_transfers_and_teacher_assignments.sql'.`);
        }

        // Try querying v_teacher_batch_payroll view
        const payrollRes = await fetch(`${SUPABASE_URL}/rest/v1/v_teacher_batch_payroll?select=*&limit=5`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        if (payrollRes.ok) {
            const payroll = await payrollRes.json();
            console.log(`3. View 'v_teacher_batch_payroll' đã hoạt động trên Supabase! Số bản ghi mẫu: ${payroll.length}`);
        } else {
            console.log(`ℹ️ View 'v_teacher_batch_payroll' cần được chạy từ 'database/migration_transfers_and_teacher_assignments.sql'.`);
        }

        console.log("=================================================");
    } catch (err) {
        console.error("Lỗi kiểm tra:", err);
    }
}

verifyNewSchema();
