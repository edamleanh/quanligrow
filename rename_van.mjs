import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Fetching all primary students from Supabase...");
    
    let allStudents = [];
    let start = 0;
    const limit = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('ds_tong')
            .select('*')
            .range(start, start + limit - 1);
            
        if (error) {
            console.error(error);
            process.exit(1);
        }
        if (data && data.length > 0) {
            allStudents = allStudents.concat(data);
            if (data.length < limit) break;
            start += limit;
        } else {
            break;
        }
    }
    
    const updates = [];
    
    allStudents.forEach(student => {
        const lop = student['LỚP'] ? student['LỚP'].toString().trim() : "";
        const isPrimary = /^[1-5](?![0-9])/.test(lop);
        
        if (isPrimary) {
            const van = student['VĂN'];
            if (van === 'G') {
                updates.push({ id: student.id, old: 'G', new: 'A' });
            } else if (van === 'K') {
                updates.push({ id: student.id, old: 'K', new: 'B' });
            }
        }
    });

    console.log(`Found ${updates.length} students to update VĂN from G->A or K->B...`);
    
    let successCount = 0;
    
    for (const update of updates) {
        try {
            const { error } = await supabase
                .from('ds_tong')
                .update({ 'VĂN': update.new })
                .eq('id', update.id);
                
            if (error) {
                console.error(`Error updating id ${update.id}:`, error.message);
            } else {
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`Updated ${successCount}/${updates.length} students...`);
                }
            }
        } catch (e) {
            console.error(`Error processing id ${update.id}:`, e);
        }
    }
    
    console.log(`Update complete! Success: ${successCount}/${updates.length}`);
    process.exit(0);
}

run().catch(console.error);
