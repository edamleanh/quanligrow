const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testPosGrouping() {
  // Find student Trương Thành Đạt (HS00010)
  const { data: students } = await supabase
    .from('students')
    .select('student_id, full_name, student_code')
    .ilike('full_name', '%Trương Thành Đạt%');

  console.log('Student:', students);

  if (students && students.length > 0) {
    const sId = students[0].student_id;
    const { data: debtRows } = await supabase
      .from('v_debt_summary')
      .select('*')
      .eq('student_id', sId)
      .order('batch_number', { ascending: true });

    console.log('Total debt rows returned:', debtRows ? debtRows.length : 0);

    // Group by class_id
    const classMap = new Map();
    (debtRows || []).forEach(r => {
      if (!classMap.has(r.class_id)) {
        classMap.set(r.class_id, {
          class_id: r.class_id,
          class_name: r.class_name,
          enrollment_status: r.enrollment_status,
          batches: []
        });
      }
      classMap.get(r.class_id).batches.push(r);
    });

    console.log('Classes Grouped:', Array.from(classMap.values()).map(c => ({
      class_name: c.class_name,
      enrollment_status: c.enrollment_status,
      batch_count: c.batches.length
    })));
  }
}

testPosGrouping();
