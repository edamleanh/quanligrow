const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanTestTransfers() {
  console.log('Cleaning test transfer records...');

  // 1. Find test transfer record for Tường Vy
  const sId = '44e23f93-0036-4679-8626-0f36af14a7b4';

  // Delete test transfers
  const { data: delData, error: delErr } = await supabase
    .from('class_transfers')
    .delete()
    .eq('student_id', sId);
  console.log('Deleted test transfers for Tường Vy:', delErr);

  // Restore enrollments for Tường Vy to clean state (ACTIVE for original class)
  // Delete the extra test enrollment added by test script
  const { error: eDelErr } = await supabase
    .from('enrollments')
    .delete()
    .eq('student_id', sId)
    .eq('class_id', '1b5745db-9196-45c3-b0f0-24315ef2f993'); // Lớp 7B added by test
  console.log('Cleaned test enrollment 7B:', eDelErr);

  // Restore original enrollment (Lớp 8A) to ACTIVE
  const { error: eUpdErr } = await supabase
    .from('enrollments')
    .update({ status: 'ACTIVE' })
    .eq('student_id', sId)
    .eq('class_id', 'd7792934-b982-407a-a908-3ceb5f8f27a3'); // Lớp 8A
  console.log('Restored original 8A enrollment to ACTIVE:', eUpdErr);

  console.log('Cleaned test transfer data for Ng Thị Tường Vy successfully!');
}

cleanTestTransfers();
