const { createClient } = require('@supabase/supabase-js');
const config = {
  url: 'https://pvlyaubewwhgzhirmwgi.supabase.co',
  key: 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw'
};

const supabase = createClient(config.url, config.key);

async function updateFees() {
  console.log('--- UPDATING DEFAULT FEE RATES FOR ALL CLASSES & BATCHES ---');

  const { data: classes, error: clsErr } = await supabase.from('classes').select('*, subjects(subject_code)');
  if (clsErr) {
    console.error('Error fetching classes:', clsErr);
    return;
  }

  let updatedClasses = 0;
  let updatedBatches = 0;

  for (const cls of classes) {
    const subCode = cls.subjects ? cls.subjects.subject_code : 'TOAN';
    const targetFee = (subCode === 'VAN') ? 300000 : 350000;

    // Update class default fee
    await supabase.from('classes').update({ default_fee_rate: targetFee }).eq('class_id', cls.class_id);
    updatedClasses++;

    // Update fee_rate for batches of this class that are currently 0 or default
    const { data: batches } = await supabase.from('batches').select('batch_id, fee_rate').eq('class_id', cls.class_id);
    if (batches && batches.length > 0) {
      for (const b of batches) {
        if (b.fee_rate === 0 || b.fee_rate === 350000 || b.fee_rate === 300000) {
          await supabase.from('batches').update({ fee_rate: targetFee }).eq('batch_id', b.batch_id);
          updatedBatches++;
        }
      }
    }
  }

  console.log(`✅ Successfully updated default fee rates:`);
  console.log(`- Classes updated: ${updatedClasses}`);
  console.log(`- Batches updated: ${updatedBatches}`);
  console.log(`- Môn Văn: 300.000 VNĐ / đợt`);
  console.log(`- Môn khác (Toán, Lý, Hóa, Anh, GVNN): 350.000 VNĐ / đợt`);
}

updateFees();
