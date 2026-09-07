const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTransferQuery() {
  const sId = '44e23f93-0036-4679-8626-0f36af14a7b4';

  const { data: transfers, error } = await supabase
    .from('class_transfers')
    .select(`
      transfer_id,
      transfer_date,
      effective_batch_number,
      reason,
      from_class:classes!from_class_id ( class_name ),
      to_class:classes!to_class_id ( class_name )
    `)
    .eq('student_id', sId)
    .order('transfer_date', { ascending: false });

  console.log('Transfers query result:', transfers, 'Error:', error);
}

testTransferQuery();
