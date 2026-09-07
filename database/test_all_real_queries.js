const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAllRealQueries() {
  console.log('--- TESTING REAL SUPABASE DATABASE QUERIES ---');

  // 1. Dashboard Stats Real Queries
  const today = new Date().toISOString().split('T')[0];
  const { data: todayReceipts, error: rErr } = await supabase
    .from('receipts')
    .select('total_amount')
    .gte('created_at', `${today}T00:00:00`);
  
  const revenueToday = (todayReceipts || []).reduce((sum, r) => sum + Number(r.total_amount || 0), 0);
  console.log('1. Today Revenue:', revenueToday, 'Receipts count:', (todayReceipts || []).length);

  const { count: studentCount, error: stErr } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true });
  console.log('2. Real Total Students Count:', studentCount, 'Error:', stErr);

  const { count: classCount, error: clErr } = await supabase
    .from('classes')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  console.log('3. Real Active Classes Count:', classCount, 'Error:', clErr);

  // Unpaid Finished Classes Real Query (from v_debt_summary or batches/classes)
  const { data: unpaidFinished, error: ufErr } = await supabase
    .from('v_class_details')
    .select('*')
    .eq('is_active', false);
  console.log('4. Finished Classes from v_class_details:', unpaidFinished ? unpaidFinished.length : null, 'Error:', ufErr);

  // 2. Students & Enrollments Real Join
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select(`
      student_id,
      student_code,
      full_name,
      phone,
      grade,
      status,
      enrollments (
        enrollment_id,
        status,
        classes ( class_id, class_name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(10);
  console.log('5. Students real join enrollments & classes count:', students ? students.length : null, 'Error:', sErr);

  // 3. Batches per class
  if (students && students.length > 0) {
    const sId = students[0].student_id;
    const { data: debts, error: dErr } = await supabase
      .from('v_debt_summary')
      .select('*')
      .eq('student_id', sId);
    console.log(`6. Real Debts for Student ${students[0].full_name} (${sId}):`, debts ? debts.length : null, 'Error:', dErr);
  }

  // 4. Teachers & Real Payroll View
  const { data: payroll, error: pErr } = await supabase
    .from('v_teacher_batch_payroll')
    .select('*')
    .limit(10);
  console.log('7. Real Teacher Batch Payroll rows:', payroll ? payroll.length : null, 'Error:', pErr);

  // 5. Class Transfers
  const { data: transfers, error: trErr } = await supabase
    .from('class_transfers')
    .select(`
      transfer_id,
      transfer_date,
      effective_batch_number,
      reason,
      from_class:classes!from_class_id(class_name),
      to_class:classes!to_class_id(class_name)
    `)
    .limit(5);
  console.log('8. Real Class Transfers count:', transfers ? transfers.length : null, 'Error:', trErr);
}

testAllRealQueries();
