import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw'; // Assuming this key allows updates or if we have a service key. Actually the user's script uses this key which allows update/insert.
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixMissingSTT() {
    try {
        console.log("Fetching all students to find missing STT...");
        
        let allStudents = [];
        let start = 0;
        const limit = 1000;
        
        // Fetch all to get max STT
        while (true) {
            const { data, error } = await supabase
                .from('ds_tong')
                .select('*')
                .range(start, start + limit - 1);
                
            if (error) {
                throw error;
            }
            if (data && data.length > 0) {
                allStudents = allStudents.concat(data);
                if (data.length < limit) break;
                start += limit;
            } else {
                break;
            }
        }
        
        let maxStt = 0;
        const missingSttStudents = [];
        
        allStudents.forEach(s => {
            let sttValue = s['STT'];
            if (!sttValue || sttValue === '' || sttValue === null) {
                missingSttStudents.push(s);
            } else {
                let sttNum = parseInt(sttValue, 10);
                if (!isNaN(sttNum) && sttNum > maxStt) {
                    maxStt = sttNum;
                }
            }
        });
        
        console.log(`Max STT currently is: ${maxStt}`);
        console.log(`Found ${missingSttStudents.length} students missing STT.`);
        
        for (const student of missingSttStudents) {
            maxStt++;
            console.log(`Assigning STT ${maxStt} to ${student['HỌ']} ${student['TÊN']}`);
            const { error } = await supabase
                .from('ds_tong')
                .update({ 'STT': maxStt.toString() })
                .eq('id', student.id);
                
            if (error) {
                console.error(`Failed to update STT for ${student.id}:`, error);
            } else {
                console.log(`Updated successfully.`);
            }
        }
        
        console.log("Done fixing STTs.");
        
    } catch (e) {
        console.error("Error:", e);
    }
}

fixMissingSTT();
