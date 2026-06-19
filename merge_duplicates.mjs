import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(supabaseUrl, supabaseKey);

const subjectColumns = ['TOÁN', 'VĂN', 'ANH', 'LÍ', 'HÓA', 'SINH', 'KHTN', 'SỬ', 'ĐỊA', 'KHXH'];

async function run() {
    console.log("Fetching all records from Supabase...");
    
    let allData = [];
    let from = 0;
    const step = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('ds_tong')
            .select('*')
            .range(from, from + step - 1);
            
        if (error) {
            console.error("Error fetching:", error);
            process.exit(1);
        }
        
        allData = allData.concat(data);
        if (data.length < step) break;
        from += step;
    }
    
    console.log(`Fetched ${allData.length} records.`);
    
    // Group by HỌ + TÊN + LỚP
    const groups = new Map();
    for (const record of allData) {
        const ho = (record['HỌ'] || '').trim();
        const ten = (record['TÊN'] || '').trim();
        const lop = (record['LỚP'] || '').trim();
        
        if (!ho || !ten) continue;
        
        const key = `${ho}|${ten}|${lop}`;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(record);
    }
    
    let mergedCount = 0;
    let conflictCount = 0;
    
    for (const [key, records] of groups.entries()) {
        if (records.length > 1) {
            // Check if they can be merged
            let canMerge = true;
            let mergedSubjects = {};
            
            // Sort by STT to keep the lowest STT as the primary record
            records.sort((a, b) => parseInt(a.STT) - parseInt(b.STT));
            
            for (const col of subjectColumns) {
                let foundValue = null;
                for (const rec of records) {
                    const val = (rec[col] || '').trim();
                    if (val) {
                        if (foundValue === null) {
                            foundValue = val;
                        } else if (foundValue !== val) {
                            // Conflict!
                            canMerge = false;
                            break;
                        }
                    }
                }
                if (!canMerge) break;
                if (foundValue !== null) {
                    mergedSubjects[col] = foundValue;
                }
            }
            
            const [ho, ten, lop] = key.split('|');
            
            if (canMerge) {
                console.log(`\n✅ Merging: ${ho} ${ten} (Lớp ${lop}) - STTs: ${records.map(r => r.STT).join(', ')}`);
                const primaryRecord = records[0];
                const recordsToDelete = records.slice(1);
                
                // Prepare update payload for primary record
                const updatePayload = {};
                let needsUpdate = false;
                for (const col of subjectColumns) {
                    const newVal = mergedSubjects[col] || null;
                    const oldVal = (primaryRecord[col] || '').trim() || null;
                    if (newVal !== oldVal) {
                        updatePayload[col] = newVal;
                        needsUpdate = true;
                    }
                }
                
                // Execute update if necessary
                if (needsUpdate) {
                    console.log(`   -> Updating STT ${primaryRecord.STT} with combined subjects:`, mergedSubjects);
                    const { error: updateErr } = await supabase
                        .from('ds_tong')
                        .update(updatePayload)
                        .eq('STT', primaryRecord.STT);
                    
                    if (updateErr) {
                        console.error(`   -> Failed to update STT ${primaryRecord.STT}:`, updateErr);
                        continue;
                    }
                }
                
                // Execute deletes
                for (const recToDelete of recordsToDelete) {
                    console.log(`   -> Deleting duplicate STT ${recToDelete.STT}`);
                    const { error: delErr } = await supabase
                        .from('ds_tong')
                        .delete()
                        .eq('STT', recToDelete.STT);
                        
                    if (delErr) {
                        console.error(`   -> Failed to delete STT ${recToDelete.STT}:`, delErr);
                    }
                }
                
                mergedCount++;
            } else {
                console.log(`\n❌ Conflict found, cannot merge: ${ho} ${ten} (Lớp ${lop}) - STTs: ${records.map(r => r.STT).join(', ')}`);
                for (const rec of records) {
                    const subs = subjectColumns.map(c => rec[c] ? `${c}: ${rec[c]}` : null).filter(Boolean).join(', ');
                    console.log(`   - STT ${rec.STT}: ${subs}`);
                }
                conflictCount++;
            }
        }
    }
    
    console.log('\n-----------------------------------');
    console.log(`Finished processing. Merged ${mergedCount} groups. Found ${conflictCount} groups with conflicts.`);
}

run().catch(console.error);
