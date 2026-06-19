import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Reading excel file...");
    const workbook = xlsx.readFile("HÈ.xlsx");
    const sheetName = "DS TỔNG";
    
    if (!workbook.Sheets[sheetName]) {
        console.error("Sheet not found.");
        process.exit(1);
    }

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    const headers = rows[2];
    
    const cleanHeaders = headers.map(h => h ? h.toString().replace(/\r\n/g, " ").trim() : "UNKNOWN");
    
    const hoIdx = cleanHeaders.indexOf("HỌ");
    const tenIdx = cleanHeaders.indexOf("TÊN");
    const lopIdx = cleanHeaders.indexOf("LỚP");
    const vanIdx = cleanHeaders.indexOf("VĂN");
    
    const updates = [];
    
    for (let i = 4; i < rows.length; i++) {
        const rowArray = rows[i];
        if (!rowArray || rowArray.length === 0) continue;
        
        const lop = rowArray[lopIdx] ? rowArray[lopIdx].toString().trim() : "";
        
        // Match only grade 6
        if (/^6(?![0-9])/.test(lop)) {
            const ho = rowArray[hoIdx] ? rowArray[hoIdx].toString().trim() : "";
            const ten = rowArray[tenIdx] ? rowArray[tenIdx].toString().trim() : "";
            if (!ho || !ten) continue;
            
            let valV = rowArray[vanIdx] ? rowArray[vanIdx].toString().trim() : "";
            
            if (valV) {
                updates.push({ ho, ten, lop, van: valV });
            }
        }
    }

    console.log(`Found ${updates.length} grade 6 students with VĂN data to update...`);
    
    let successCount = 0;
    
    for (const update of updates) {
        try {
            const { error } = await supabase
                .from('ds_tong')
                .update({ 'VĂN': update.van })
                .eq('HỌ', update.ho)
                .eq('TÊN', update.ten)
                .eq('LỚP', update.lop);
                
            if (error) {
                console.error(`Error updating ${update.ho} ${update.ten}:`, error.message);
            } else {
                successCount++;
                if (successCount % 5 === 0 || successCount === updates.length) {
                    console.log(`Updated ${successCount}/${updates.length} students...`);
                }
            }
        } catch (e) {
            console.error(`Error processing ${update.ho} ${update.ten}:`, e);
        }
    }
    
    console.log(`Update complete! Success: ${successCount}/${updates.length}`);
    process.exit(0);
}

run().catch(console.error);
