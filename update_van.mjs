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
    
    const sttIdx = cleanHeaders.indexOf("STT");
    const lopIdx = cleanHeaders.indexOf("LỚP");
    const nhomTIdx = cleanHeaders.indexOf("NHOM  T"); // In pandas it was NHOM\n T
    // Let's find exactly by substring since \n might be spaces
    const nTIdx = cleanHeaders.findIndex(h => h.includes("NHOM") && h.includes("T") && !h.includes("TOÁN"));
    const nVIdx = cleanHeaders.findIndex(h => h.includes("NHOM") && h.includes("V") && !h.includes("AV"));
    
    console.log("Header indices:", { STT: sttIdx, LỚP: lopIdx, NHOM_T: nTIdx, NHOM_V: nVIdx });

    const updates = [];
    
    for (let i = 4; i < rows.length; i++) {
        const rowArray = rows[i];
        if (!rowArray || rowArray.length === 0) continue;
        if (!rowArray[0] && !rowArray[1] && !rowArray[2]) continue;
        
        const lop = rowArray[lopIdx] ? rowArray[lopIdx].toString().trim() : "";
        const isPrimary = /^[1-5](?![0-9])/.test(lop);
        
        if (isPrimary) {
            const stt = rowArray[sttIdx] ? rowArray[sttIdx].toString() : null;
            if (!stt) continue;
            
            let valT = rowArray[nTIdx] ? rowArray[nTIdx].toString().trim() : "";
            let valV = rowArray[nVIdx] ? rowArray[nVIdx].toString().trim() : "";
            
            // "chỉ cần 1 trong 2 cột có kí tự trên lưu lại học sinh đó là với Văn với kí tự đó"
            let charToSet = valV || valT; // prefer V over T, or just take whatever is available
            
            if (charToSet) {
                updates.push({ stt, van: charToSet });
            }
        }
    }

    console.log(`Found ${updates.length} primary students to update VĂN...`);
    
    let successCount = 0;
    
    for (const update of updates) {
        try {
            const { error } = await supabase
                .from('ds_tong')
                .update({ 'VĂN': update.van })
                .eq('STT', update.stt);
                
            if (error) {
                console.error(`Error updating STT ${update.stt}:`, error.message);
            } else {
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`Updated ${successCount}/${updates.length} students...`);
                }
            }
        } catch (e) {
            console.error(`Error processing STT ${update.stt}:`, e);
        }
    }
    
    console.log(`Update complete! Success: ${successCount}/${updates.length}`);
    process.exit(0);
}

run().catch(console.error);
