const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const rawData = fs.readFileSync('database/backups/ds_tong_backup.json', 'utf8');
const backupData = JSON.parse(rawData);

const subjectMeta = {
  'TOÁN': { code: 'TOAN', name: 'Toán' },
  'Lý': { code: 'LY', name: 'Vật Lý' },
  'Hóa': { code: 'HOA', name: 'Hóa Học' },
  'VĂN': { code: 'VAN', name: 'Ngữ Văn' },
  'AV': { code: 'AV', name: 'Anh Văn' }
};

function parseGrade(gradeStr) {
  if (!gradeStr) return 0;
  const num = parseInt(gradeStr.toString().trim(), 10);
  if (isNaN(num) || num < 1 || num > 12) return 0;
  return num;
}

function cleanPhone(phoneStr) {
  if (!phoneStr) return null;
  const cleaned = phoneStr.toString().trim().replace(/[^0-9]/g, '');
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    return cleaned;
  }
  return null;
}

async function runMigration() {
  console.log('=== EDUMANAGER V2 - SUPABASE DATA MIGRATION ===');
  console.log(`Loaded ${backupData.length} records from ds_tong_backup.json`);

  console.log('\n--- 0. Cleaning Existing Tables ---');
  await supabase.from('enrollments').delete().neq('enrollment_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('students').delete().neq('student_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('classes').delete().neq('class_id', '00000000-0000-0000-0000-000000000000');
  console.log('Existing classes, students, and enrollments cleared.');

  // 1. Seed Academic Year 2025-2026
  console.log('\n--- 1. Seeding Academic Year 2025-2026 ---');
  const { data: yearData, error: yearError } = await supabase
    .from('academic_years')
    .upsert(
      {
        year_name: '2025-2026',
        start_date: '2025-09-01',
        end_date: '2026-05-31',
        is_current: true
      },
      { onConflict: 'year_name' }
    )
    .select();
  if (yearError) {
    console.error('Error seeding academic year:', yearError);
    return;
  }
  console.log('Academic Year created/verified:', yearData);

  // 2. Seed Subjects
  console.log('\n--- 2. Seeding Standard Subjects ---');
  const subjectsToSeed = [
    { subject_code: 'TOAN', subject_name: 'Toán Học' },
    { subject_code: 'LY', subject_name: 'Vật Lý' },
    { subject_code: 'HOA', subject_name: 'Hóa Học' },
    { subject_code: 'VAN', subject_name: 'Ngữ Văn' },
    { subject_code: 'AV', subject_name: 'Anh Văn' },
    { subject_code: 'GVNN', subject_name: 'Giáo Viên Nước Ngoài' }
  ];
  const { data: subjectsData, error: subjectsError } = await supabase
    .from('subjects')
    .upsert(subjectsToSeed, { onConflict: 'subject_code' })
    .select();

  if (subjectsError) {
    console.error('Error seeding subjects:', subjectsError);
    return;
  }
  console.log(`Seeded ${subjectsData.length} subjects.`);

  // Map subject_code -> subject_id
  const subjectIdMap = {};
  subjectsData.forEach(sub => {
    subjectIdMap[sub.subject_code] = sub.subject_id;
  });

  // 3. Extract & Create Classes
  console.log('\n--- 3. Extracting and Creating Classes ---');
  const uniqueClassesMap = new Map(); // key: "SUB_CODE|GRADE|GROUP"

  backupData.forEach(item => {
    const grade = parseGrade(item['LỚP']);
    if (!grade) return;

    for (const subKey in subjectMeta) {
      const groupVal = (item[subKey] || '').toString().trim();
      if (groupVal) {
        const subInfo = subjectMeta[subKey];
        const classKey = `${subInfo.code}_${grade}_${groupVal}`;
        const className = `${subInfo.name} ${grade}${groupVal}`;

        if (!uniqueClassesMap.has(classKey)) {
          uniqueClassesMap.set(classKey, {
            class_key: classKey,
            class_name: className,
            academic_year: '2025-2026',
            grade: grade,
            subject_id: subjectIdMap[subInfo.code],
            default_fee_rate: 0,
            is_active: true
          });
        }
      }
    }
  });

  console.log(`Identified ${uniqueClassesMap.size} unique classes.`);
  const classesList = Array.from(uniqueClassesMap.values()).map(c => ({
    class_name: c.class_name,
    academic_year: c.academic_year,
    grade: c.grade,
    subject_id: c.subject_id,
    default_fee_rate: c.default_fee_rate,
    is_active: c.is_active
  }));

  const { data: insertedClasses, error: classesError } = await supabase
    .from('classes')
    .insert(classesList)
    .select();

  if (classesError) {
    console.error('Error inserting classes:', classesError);
    return;
  }
  console.log(`Successfully created ${insertedClasses.length} classes on Supabase.`);

  // Build class_name -> class_id lookup map
  const classNameToId = {};
  insertedClasses.forEach(cls => {
    classNameToId[cls.class_name] = cls.class_id;
  });

  // 4. Insert Students & Enrollments
  console.log('\n--- 4. Inserting Students and Enrollments ---');
  const studentRows = [];
  const enrollmentRows = [];

  backupData.forEach((item, index) => {
    const grade = parseGrade(item['LỚP']) || 1;
    const ho = (item['HỌ'] || '').toString().trim();
    const ten = (item['TÊN'] || '').toString().trim();
    const fullName = `${ho} ${ten}`.trim() || `Học Sinh ${index + 1}`;
    const phone = cleanPhone(item['SỐ ĐT']);
    const studentCode = `HS${String(index + 1).padStart(5, '0')}`;
    const studentId = item['id']; // Preserve UUID from backup JSON!

    let notesParts = [];
    if (item['NƠI HỌC']) notesParts.push(`Nơi học: ${item['NƠI HỌC'].trim()}`);
    if (item['TRƯỜNG']) notesParts.push(`Trường: ${item['TRƯỜNG'].trim()}`);
    if (item['Ghi chú']) notesParts.push(`Ghi chú: ${item['Ghi chú'].trim()}`);

    studentRows.push({
      student_id: studentId,
      student_code: studentCode,
      full_name: fullName,
      phone: phone,
      grade: grade,
      status: 'DANG_HOC',
      notes: notesParts.length > 0 ? notesParts.join(' | ') : null
    });

    // Check enrollments for this student
    for (const subKey in subjectMeta) {
      const groupVal = (item[subKey] || '').toString().trim();
      if (groupVal) {
        const subInfo = subjectMeta[subKey];
        const className = `${subInfo.name} ${grade}${groupVal}`;
        const classId = classNameToId[className];
        if (classId) {
          enrollmentRows.push({
            student_id: studentId,
            class_id: classId,
            status: 'ACTIVE'
          });
        }
      }
    }
  });

  console.log(`Prepared ${studentRows.length} student records.`);
  console.log(`Prepared ${enrollmentRows.length} enrollment records.`);

  // Insert students in chunks of 200
  const CHUNK_SIZE = 200;
  for (let i = 0; i < studentRows.length; i += CHUNK_SIZE) {
    const chunk = studentRows.slice(i, i + CHUNK_SIZE);
    const { error: studentChunkError } = await supabase.from('students').insert(chunk);
    if (studentChunkError) {
      console.error(`Error inserting student chunk ${i}:`, studentChunkError);
      return;
    }
    console.log(`Inserted students ${i + 1} to ${Math.min(i + CHUNK_SIZE, studentRows.length)}`);
  }

  // Insert enrollments in chunks of 300
  for (let i = 0; i < enrollmentRows.length; i += CHUNK_SIZE) {
    const chunk = enrollmentRows.slice(i, i + CHUNK_SIZE);
    const { error: enrollChunkError } = await supabase.from('enrollments').insert(chunk);
    if (enrollChunkError) {
      console.error(`Error inserting enrollment chunk ${i}:`, enrollChunkError);
      return;
    }
    console.log(`Inserted enrollments ${i + 1} to ${Math.min(i + CHUNK_SIZE, enrollmentRows.length)}`);
  }

  // 5. Verify Database State
  console.log('\n=== MIGRATION VERIFICATION ===');
  const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
  const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });
  const { count: enrollCount } = await supabase.from('enrollments').select('*', { count: 'exact', head: true });
  const { count: batchCount } = await supabase.from('batches').select('*', { count: 'exact', head: true });

  console.log(`- Students created: ${studentCount} / ${backupData.length}`);
  console.log(`- Classes created: ${classCount} / ${uniqueClassesMap.size}`);
  console.log(`- Enrollments created: ${enrollCount}`);
  console.log(`- Batches auto-generated: ${batchCount} (${classCount} classes x 12 batches = ${classCount * 12})`);
  console.log('\n✅ DATA MIGRATION COMPLETED SUCCESSFULLY!');
}

runMigration().catch(console.error);
