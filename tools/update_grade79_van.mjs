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
    const hoIdx = cleanHeaders.indexOf("HỌ");
    const tenIdx = cleanHeaders.indexOf("TÊN");
    const lopIdx = cleanHeaders.indexOf("LỚP");
    const vanIdx = cleanHeaders.indexOf("VĂN");
    
    const updates = [];
    
    for (let i = 4; i < rows.length; i++) {
        const rowArray = rows[i];
        if (!rowArray || rowArray.length === 0) continue;
        
        const lop = rowArray[lopIdx] ? rowArray[lopIdx].toString().trim() : "";
        const van = rowArray[vanIdx] ? rowArray[vanIdx].toString().trim() : "";
        
        if ((/^7(?![0-9])/.test(lop) || /^9(?![0-9])/.test(lop)) && van) {
            const ho = rowArray[hoIdx] ? rowArray[hoIdx].toString().trim() : "";
            const ten = rowArray[tenIdx] ? rowArray[tenIdx].toString().trim() : "";
            if (!ho || !ten) continue;
            
            updates.push({ 
                ho, 
                ten, 
                lop, 
                van,
                rowIndex: i,
                stt_excel: rowArray[sttIdx]
            });
        }
    }

    console.log(`Found ${updates.length} students in grade 7/9 with VĂN data...`);
    
    let successCount = 0;
    
    for (const update of updates) {
        try {
            let { data: students, error: selectError } = await supabase
                .from('ds_tong')
                .select('STT, HỌ, TÊN, LỚP, VĂN')
                .eq('HỌ', update.ho)
                .eq('TÊN', update.ten)
                .eq('LỚP', update.lop);

            if (selectError) {
                console.error(`Select Error for ${update.ho} ${update.ten}:`, selectError.message);
                continue;
            }

            if (!students || students.length === 0) {
                const { data: studentsWithSpace, error: selectError2 } = await supabase
                    .from('ds_tong')
                    .select('STT, HỌ, TÊN, LỚP, VĂN')
                    .eq('HỌ', update.ho + " ")
                    .eq('TÊN', update.ten)
                    .eq('LỚP', update.lop);
                    
                if (studentsWithSpace && studentsWithSpace.length > 0) {
                    students = studentsWithSpace;
                } else {
                    const { data: studentsWithTenSpace } = await supabase
                        .from('ds_tong')
                        .select('STT, HỌ, TÊN, LỚP, VĂN')
                        .eq('HỌ', update.ho)
                        .eq('TÊN', update.ten + " ")
                        .eq('LỚP', update.lop);
                    
                    if (studentsWithTenSpace && studentsWithTenSpace.length > 0) {
                        students = studentsWithTenSpace;
                    } else {
                        console.log(`WARNING: Not found in Supabase: ${update.ho} ${update.ten} (LỚP: ${update.lop})`);
                        continue;
                    }
                }
            }

            const targetStudent = students[0]; 

            const { error: updateError } = await supabase
                .from('ds_tong')
                .update({ 'VĂN': update.van })
                .eq('STT', targetStudent.STT);
                
            if (updateError) {
                console.error(`Error updating ${update.ho} ${update.ten}:`, updateError.message);
            } else {
                successCount++;
            }
        } catch (e) {
            console.error(`Exception processing ${update.ho} ${update.ten}:`, e);
        }
    }
    
    console.log(`\nUpdate complete! Success: ${successCount}/${updates.length}`);
    process.exit(0);
}

run().catch(console.error);
