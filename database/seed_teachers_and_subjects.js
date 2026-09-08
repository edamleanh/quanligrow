const { createClient } = require('@supabase/supabase-js');
const config = {
  url: 'https://pvlyaubewwhgzhirmwgi.supabase.co',
  key: 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw'
};

const supabase = createClient(config.url, config.key);

const desiredSubjects = [
  { subject_code: 'TOAN', subject_name: 'Toán Học' },
  { subject_code: 'LY', subject_name: 'Vật Lý' },
  { subject_code: 'HOA', subject_name: 'Hóa Học' },
  { subject_code: 'VAN', subject_name: 'Ngữ Văn' },
  { subject_code: 'AV', subject_name: 'Anh Văn' },
  { subject_code: 'GVNN', subject_name: 'Giáo Viên Nước Ngoài' },
  { subject_code: 'SINH', subject_name: 'Sinh Học' },
  { subject_code: 'SU', subject_name: 'Lịch Sử' },
  { subject_code: 'DIA', subject_name: 'Địa Lý' },
  { subject_code: 'TIN', subject_name: 'Tin Học' }
];

const sampleNames = {
  TOAN: ['Nguyễn Văn Toàn', 'Trần Thị Thu Thảo', 'Lê Hoàng Minh'],
  LY: ['Phạm Đức Mạnh', 'Vũ Thị Ngọc Hà', 'Đặng Quốc Bảo'],
  HOA: ['Bùi Thanh Hải', 'Hoàng Mơ Chi', 'Ngô Quang Hiếu'],
  VAN: ['Nguyễn Thị Mai Hương', 'Trần Thảo Ly', 'Phan Văn Nam'],
  AV: ['Đỗ Anh Tuấn', 'Nguyễn Thị Hồng Hạnh', 'Lê Thanh Phương'],
  GVNN: ['John Smith', 'Sarah Jenkins', 'Michael Brown'],
  SINH: ['Nguyễn Tấn Đạt', 'Lê Thị Thu Trâm', 'Phạm Hoàng Long'],
  SU: ['Trần Văn Hùng', 'Vũ Thị Thanh Tâm', 'Nguyễn Đức Tiến'],
  DIA: ['Hoàng Văn Nam', 'Đặng Thị Cẩm Tú', 'Bùi Văn Sơn'],
  TIN: ['Phạm Thành Trung', 'Lê Văn Việt', 'Nguyễn Hoài Nam']
};

async function seed() {
  console.log('--- SEEDING 10 SUBJECTS & 3 TEACHERS PER SUBJECT ---');

  // 1. Upsert Subjects
  for (const s of desiredSubjects) {
    const { data: existing } = await supabase.from('subjects').select('*').eq('subject_code', s.subject_code).single();
    if (!existing) {
      const { data, error } = await supabase.from('subjects').insert([s]).select().single();
      if (error) console.error('Error inserting subject:', s.subject_code, error);
      else console.log('Inserted subject:', data.subject_code, data.subject_id);
    }
  }

  // Fetch all 10 subjects
  const { data: subjects, error: subErr } = await supabase.from('subjects').select('*').order('subject_id');
  if (subErr) {
    console.error('Error fetching subjects:', subErr);
    return;
  }

  console.log(`Total subjects in database: ${subjects.length}`);

  // 2. Insert 3 Teachers per Subject
  let totalInserted = 0;
  for (const sub of subjects) {
    const codePrefix = sub.subject_code;
    const names = sampleNames[codePrefix] || [`GV ${sub.subject_name} 1`, `GV ${sub.subject_name} 2`, `GV ${sub.subject_name} 3`];

    for (let i = 0; i < 3; i++) {
      const teacherCode = `GV-${codePrefix}-${(i + 1).toString().padStart(2, '0')}`;
      const fullName = names[i];
      const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

      // Check if teacher_code exists
      const { data: existingTeacher } = await supabase.from('teachers').select('*').eq('teacher_code', teacherCode).single();
      if (!existingTeacher) {
        const { data: newTeacher, error: insertErr } = await supabase.from('teachers').insert([{
          teacher_code: teacherCode,
          full_name: fullName,
          phone: phone,
          specialization_subject_id: sub.subject_id
        }]).select().single();

        if (insertErr) {
          console.error(`Error inserting teacher ${teacherCode}:`, insertErr);
        } else {
          console.log(`+ Created Teacher: ${newTeacher.teacher_code} - ${newTeacher.full_name} (${sub.subject_name})`);
          totalInserted++;
        }
      } else {
        console.log(`Existing Teacher: ${existingTeacher.teacher_code} - ${existingTeacher.full_name}`);
      }
    }
  }

  console.log(`\n✅ Finished! Added ${totalInserted} teachers. Total teachers now: ${subjects.length * 3}`);

  // 3. Assign Teachers to Classes randomly matching subject_id
  console.log('\n--- ASSIGNING TEACHERS TO EXISTING CLASSES ---');
  const { data: allTeachers } = await supabase.from('teachers').select('*');
  const { data: allClasses } = await supabase.from('classes').select('*');

  let updatedClassesCount = 0;
  for (const cls of allClasses) {
    if (!cls.teacher_id) {
      // Find teachers for this class's subject_id
      const subjectTeachers = allTeachers.filter(t => t.specialization_subject_id === cls.subject_id);
      const chosenTeacher = subjectTeachers.length > 0
        ? subjectTeachers[Math.floor(Math.random() * subjectTeachers.length)]
        : allTeachers[Math.floor(Math.random() * allTeachers.length)];

      if (chosenTeacher) {
        await supabase.from('classes').update({ teacher_id: chosenTeacher.teacher_id }).eq('class_id', cls.class_id);
        updatedClassesCount++;
      }
    }
  }

  console.log(`✅ Assigned teachers to ${updatedClassesCount} classes!`);
}

seed();
