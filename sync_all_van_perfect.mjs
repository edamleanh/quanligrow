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
    
    let globalSTT = 1;
    for (let i = 4; i < rows.length; i++) {
        const rowArray = rows[i];
        if (!rowArray || rowArray.length === 0) {
            globalSTT++;
            continue;
        }
        
        const ho = rowArray[hoIdx] ? rowArray[hoIdx].toString().trim() : "";
        const ten = rowArray[tenIdx] ? rowArray[tenIdx].toString().trim() : "";
        if (!ho || !ten) {
            globalSTT++;
            continue;
        }
        
        const valV = rowArray[vanIdx] ? rowArray[vanIdx].toString().trim() : "";
        
        updates.push({ stt: globalSTT.toString(), ho, ten, van: valV });
        globalSTT++;
    }

    console.log(`Found ${updates.length} students across ALL grades. Syncing VĂN strictly by STT and Name...`);
    
    let successCount = 0;
    
    for (const update of updates) {
        try {
            let { data: students, error: selectError } = await supabase
                .from('ds_tong')
                .select('STT, HỌ, TÊN, VĂN')
                .eq('STT', update.stt);

            if (selectError) {
                console.error(`Select Error for STT ${update.stt}:`, selectError.message);
                continue;
            }

            if (!students || students.length === 0) {
                continue; 
            }

            const targetStudent = students[0]; 

            const targetHo = (targetStudent['HỌ'] || "").trim();
            const targetTen = (targetStudent['TÊN'] || "").trim();
            
            // Double check name just in case STT got completely desynchronized
            if (targetHo === update.ho.trim() || targetTen === update.ten.trim()) {
                if (targetStudent['VĂN'] !== update.van) {
                    const { error: updateError } = await supabase
                        .from('ds_tong')
                        .update({ 'VĂN': update.van })
                        .eq('STT', targetStudent.STT);
                        
                    if (updateError) {
                        console.error(`Error updating STT ${update.stt}:`, updateError.message);
                    } else {
                        successCount++;
                    }
                }
            } else {
                console.warn(`STT ${update.stt} mismatch: Supabase has '${targetHo} ${targetTen}', Excel has '${update.ho} ${update.ten}'`);
            }
        } catch (e) {
            console.error(`Exception processing STT ${update.stt}:`, e);
        }
    }
    
    console.log(`Sync complete! Updated ${successCount} differing records using precise STT + Name matching for ALL GRADES.`);
    process.exit(0);
}

run().catch(console.error);
