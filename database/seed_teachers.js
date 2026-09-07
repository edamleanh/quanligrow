const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

async function checkAndSeedTeachers() {
    try {
        console.log("=================================================");
        console.log("🚀 BẮT ĐẦU KHỞI TẠO VÀ PHÂN CÔNG GIÁO VIÊN");
        console.log("=================================================");

        const teachersRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers?select=*`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        let teachers = await teachersRes.json();

        if (!teachers || teachers.length === 0) {
            const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/teachers`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify([
                    { teacher_code: 'GV001', full_name: 'Thầy Trần Văn Anh', phone: '0901234567' },
                    { teacher_code: 'GV002', full_name: 'Cô Nguyễn Thị Hoa', phone: '0902345678' }
                ])
            });
            teachers = await insertRes.json();
            console.log("✅ Đã khởi tạo danh mục Giáo viên:", teachers);
        }

        const teacherTran = teachers.find(t => t.full_name.includes('Trần Văn Anh')) || teachers[0];

        // Assign teacherTran to 15 classes
        const classesRes = await fetch(`${SUPABASE_URL}/rest/v1/classes?select=class_id,class_name&limit=15`, {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        const sampleClasses = await classesRes.json();

        for (const c of sampleClasses) {
            await fetch(`${SUPABASE_URL}/rest/v1/classes?class_id=eq.${c.class_id}`, {
                method: 'PATCH',
                headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ teacher_id: teacherTran.teacher_id })
            });
        }

        console.log(`✅ Đã phân công ${sampleClasses.length} lớp học cho ${teacherTran.full_name}.`);
        console.log("=================================================");
    } catch (err) {
        console.error("Lỗi seed teachers:", err);
    }
}

checkAndSeedTeachers();
