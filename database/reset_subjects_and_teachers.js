const { createClient } = require('@supabase/supabase-js');
const config = {
  url: 'https://pvlyaubewwhgzhirmwgi.supabase.co',
  key: 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw'
};

const supabase = createClient(config.url, config.key);

const allowedSubjects = [
  { subject_code: 'TOAN', subject_name: 'Toán Học' },
  { subject_code: 'LY', subject_name: 'Vật Lý' },
  { subject_code: 'HOA', subject_name: 'Hóa Học' },
  { subject_code: 'VAN', subject_name: 'Ngữ Văn' },
  { subject_code: 'AV', subject_name: 'Anh Văn' },
  { subject_code: 'GVNN', subject_name: 'Giáo Viên Nước Ngoài' }
];

const sampleNames = {
  TOAN: ['Nguyễn Văn Toàn', 'Trần Thị Thu Thảo', 'Lê Hoàng Minh'],
  LY: ['Phạm Đức Mạnh', 'Vũ Thị Ngọc Hà', 'Đặng Quốc Bảo'],
  HOA: ['Bùi Thanh Hải', 'Hoàng Mơ Chi', 'Ngô Quang Hiếu'],
  VAN: ['Nguyễn Thị Mai Hương', 'Trần Thảo Ly', 'Phan Văn Nam'],
  AV: ['Đỗ Anh Tuấn', 'Nguyễn Thị Hồng Hạnh', 'Lê Thanh Phương'],
  GVNN: ['John Smith', 'Sarah Jenkins', 'Michael Brown']
};

async function reset() {
  console.log('--- RESETTING TO STRICTLY 6 SPECIALIZATION SUBJECTS (TOÁN, LÝ, HÓA, VĂN, ANH VĂN, GVNN) ---');

  // 1. Get all subjects
  const { data: allSubs } = await supabase.from('subjects').select('*');
  const allowedCodes = allowedSubjects.map(s => s.subject_code);
  const extraSubs = allSubs.filter(s => !allowedCodes.includes(s.subject_code));

  const coreSubs = allSubs.filter(s => allowedCodes.includes(s.subject_code));
  const coreSubIds = coreSubs.map(s => s.subject_id);

  // 2. Re-assign classes that have extra subject_id to core subject_ids (e.g. TOAN = coreSubs[0].subject_id)
  for (const extra of extraSubs) {
    console.log(`Re-assigning classes from extra subject ${extra.subject_code} (ID: ${extra.subject_id})...`);
    // Re-assign classes to TOAN
    await supabase.from('classes').update({ subject_id: coreSubs[0].subject_id }).eq('subject_id', extra.subject_id);
  }

  // 3. Delete teachers of extra subjects
  for (const extra of extraSubs) {
    const { data: teachersToDelete } = await supabase.from('teachers').select('teacher_id').eq('specialization_subject_id', extra.subject_id);
    if (teachersToDelete && teachersToDelete.length > 0) {
      const tIds = teachersToDelete.map(t => t.teacher_id);
      // nullify teacher_id in classes and batches first
      await supabase.from('classes').update({ teacher_id: null }).in('teacher_id', tIds);
      await supabase.from('batches').update({ teacher_id: null }).in('teacher_id', tIds);
      await supabase.from('teachers').delete().in('teacher_id', tIds);
      console.log(`Deleted ${tIds.length} teachers for extra subject ${extra.subject_code}`);
    }
  }

  // 4. Delete extra subjects
  const extraIds = extraSubs.map(s => s.subject_id);
  if (extraIds.length > 0) {
    await supabase.from('subjects').delete().in('subject_id', extraIds);
    console.log(`Deleted ${extraIds.length} extra subjects.`);
  }

  // 5. Ensure core 6 subjects exist & have 3 teachers each
  const { data: currentSubjects } = await supabase.from('subjects').select('*').order('subject_id');
  console.log(`Core subjects remaining (${currentSubjects.length}):`, currentSubjects.map(s => s.subject_code).join(', '));

  for (const sub of currentSubjects) {
    const codePrefix = sub.subject_code;
    const names = sampleNames[codePrefix] || [`GV ${sub.subject_name} 1`, `GV ${sub.subject_name} 2`, `GV ${sub.subject_name} 3`];

    // Check existing teachers for this subject
    const { data: existingTeachers } = await supabase.from('teachers').select('*').eq('specialization_subject_id', sub.subject_id);
    const existingCount = existingTeachers ? existingTeachers.length : 0;

    for (let i = existingCount; i < 3; i++) {
      const teacherCode = `GV-${codePrefix}-${(i + 1).toString().padStart(2, '0')}`;
      const fullName = names[i];
      const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;

      const { data: newTeacher, error: insertErr } = await supabase.from('teachers').insert([{
        teacher_code: teacherCode,
        full_name: fullName,
        phone: phone,
        specialization_subject_id: sub.subject_id
      }]).select().single();

      if (insertErr) console.error(`Error inserting teacher ${teacherCode}:`, insertErr);
      else console.log(`+ Created Teacher: ${newTeacher.teacher_code} - ${newTeacher.full_name} (${sub.subject_name})`);
    }
  }

  // 6. Final verification & Class assignment
  const { data: finalTeachers } = await supabase.from('teachers').select('*');
  const { data: allClasses } = await supabase.from('classes').select('*');

  console.log(`Total Teachers now: ${finalTeachers.length} (3 per core subject)`);

  let updatedClassesCount = 0;
  for (const cls of allClasses) {
    // Find matching teacher for this class's subject_id
    const subjectTeachers = finalTeachers.filter(t => t.specialization_subject_id === cls.subject_id);
    const chosenTeacher = subjectTeachers.length > 0
      ? subjectTeachers[Math.floor(Math.random() * subjectTeachers.length)]
      : finalTeachers[Math.floor(Math.random() * finalTeachers.length)];

    if (chosenTeacher) {
      await supabase.from('classes').update({ teacher_id: chosenTeacher.teacher_id }).eq('class_id', cls.class_id);
      updatedClassesCount++;
    }
  }

  console.log(`✅ Updated ${updatedClassesCount} classes with matching subject teachers!`);
}

reset();
