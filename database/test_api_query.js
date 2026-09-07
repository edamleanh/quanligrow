const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testViews() {
  console.log('--- Testing PostgreSQL Views & Tables ---');

  // 1. Students
  const { data: students, error: sErr } = await supabase.from('students').select('*').limit(5);
  console.log('1. Students:', students ? students.length : null, 'Error:', sErr);

  // 2. Class Details View
  const { data: vClasses, error: cErr } = await supabase.from('v_class_details').select('*').limit(5);
  console.log('2. v_class_details:', vClasses ? vClasses.length : null, 'Sample:', vClasses ? vClasses[0] : null, 'Error:', cErr);

  // 3. Debt Summary View
  const { data: vDebts, error: dErr } = await supabase.from('v_debt_summary').select('*').limit(5);
  console.log('3. v_debt_summary:', vDebts ? vDebts.length : null, 'Sample:', vDebts ? vDebts[0] : null, 'Error:', dErr);

  // 4. Teacher Batch Payroll View
  const { data: vPayroll, error: pErr } = await supabase.from('v_teacher_batch_payroll').select('*').limit(5);
  console.log('4. v_teacher_batch_payroll:', vPayroll ? vPayroll.length : null, 'Sample:', vPayroll ? vPayroll[0] : null, 'Error:', pErr);

  // 5. Receipts
  const { data: receipts, error: rErr } = await supabase.from('receipts').select('*').limit(5);
  console.log('5. Receipts:', receipts ? receipts.length : null, 'Error:', rErr);

  // 6. Teachers
  const { data: teachers, error: tErr } = await supabase.from('teachers').select('*').limit(5);
  console.log('6. Teachers:', teachers ? teachers.length : null, 'Error:', tErr);
}

testViews();
