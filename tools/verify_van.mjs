import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Downloading data from Supabase...");
    
    // Fetch all records from ds_tong
    let allSupabaseData = [];
    let from = 0;
    const step = 1000;
    
    while (true) {
        const { data, error } = await supabase
            .from('ds_tong')
            .select('STT, HỌ, TÊN, LỚP, VĂN')
            .range(from, from + step - 1);
            
        if (error) {
            console.error("Error fetching Supabase data:", error);
            process.exit(1);
        }
        
        allSupabaseData = allSupabaseData.concat(data);
        if (data.length < step) break;
        from += step;
    }
    
    console.log(`Downloaded ${allSupabaseData.length} records from Supabase.`);
    
    console.log("Reading excel file...");
    const workbook = xlsx.readFile("HÈ.xlsx");
    const sheetName = "DS TỔNG";
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    const vanIdx = 19; // Pre-identified correct column for VĂN

    console.log("Starting comparison...");
    
    let mismatches = [];
    let checkedCount = 0;
    
    let globalSTT = 1;
    for (let i = 4; i < rows.length; i++) {
        const rowArray = rows[i];
        if (!rowArray || rowArray.length === 0) {
            globalSTT++;
            continue;
        }
        
        const hoExcel = (rowArray[1] || "").toString().trim();
        const tenExcel = (rowArray[2] || "").toString().trim();
        
        if (!hoExcel || !tenExcel) {
            globalSTT++;
            continue;
        }
        
        const vanExcel = (rowArray[vanIdx] || "").toString().trim();
        
        // Find matching Supabase record
        const supaRecord = allSupabaseData.find(s => s.STT === globalSTT.toString());
        
        if (!supaRecord) {
            mismatches.push(`Missing in Supabase: STT ${globalSTT} - ${hoExcel} ${tenExcel}`);
        } else {
            const vanSupa = (supaRecord['VĂN'] || "").toString().trim();
            
            if (vanExcel !== vanSupa) {
                mismatches.push(`Mismatch for STT ${globalSTT} (${hoExcel} ${tenExcel}): Excel='${vanExcel}' vs Supabase='${vanSupa}'`);
            }
        }
        
        checkedCount++;
        globalSTT++;
    }
    
    console.log("-----------------------------------------");
    console.log(`Checked ${checkedCount} valid students.`);
    
    if (mismatches.length === 0) {
        console.log("✅ SUCCESS: 100% MATCH! ALL VĂN records in Supabase exactly match the Excel file.");
    } else {
        console.log(`❌ FOUND ${mismatches.length} MISMATCHES:`);
        mismatches.slice(0, 50).forEach(m => console.log(m));
        if (mismatches.length > 50) console.log(`...and ${mismatches.length - 50} more.`);
    }
}

run().catch(console.error);
