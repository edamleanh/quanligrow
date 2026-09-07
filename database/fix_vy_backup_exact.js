const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixVyExact() {
  const sId = '44e23f93-0036-4679-8626-0f36af14a7b4'; // Ng Thị Tường Vy (HS00001)

  // 1. Delete extra enrollment 8A added by earlier test script
  const { error: delErr } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', sId)
    .eq('class_id', 'd7792934-b982-407a-a908-3ceb5f8f27a3'); // Lớp 8A - Toán

  console.log('Removed extra enrollment 8A:', delErr);

  // 2. Clear placeholder phone to match original backup file (SỐ ĐT: "") if needed, or set notes
  const { error: updErr } = await supabase
    .from('students')
    .update({ phone: '0900000001' }) // Keep valid 10-digit phone for CHECK constraint
    .eq('student_id', sId);

  console.log('Updated student info:', updErr);

  // 3. Verify final state
  const { data: finalStudent } = await supabase
    .from('students')
    .select('*, enrollments(*, classes(class_name))')
    .eq('student_id', sId);

  console.log('Final Student State in DB:', JSON.stringify(finalStudent, null, 2));
}

fixVyExact();
