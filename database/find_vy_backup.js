const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkVyInDb() {
  const { data: students } = await supabase
    .from('students')
    .select('*, enrollments(*, classes(*))')
    .eq('full_name', 'Ng Thị Tường Vy');

  console.log('Students in DB with name Ng Thị Tường Vy:', JSON.stringify(students, null, 2));
}

checkVyInDb();
