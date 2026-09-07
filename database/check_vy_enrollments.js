const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkVy() {
  // Find student Ng Thị Tường Vy
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .ilike('full_name', '%Tường Vy%');

  console.log('Students:', students);

  if (students && students.length > 0) {
    const sId = students[0].student_id;
    // Enrollments
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('*, classes(class_name)')
      .eq('student_id', sId);
    console.log('Enrollments for Tường Vy:', enrollments);

    // Class Transfers
    const { data: transfers } = await supabase
      .from('class_transfers')
      .select('*')
      .eq('student_id', sId);
    console.log('Transfers for Tường Vy:', transfers);
  }
}

checkVy();
