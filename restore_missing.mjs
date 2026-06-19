import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("Downloading data from Supabase...");
    let allSupabaseData = [];
    let from = 0;
    const step = 1000;
    
    while (true) {
        const { data, error } = await supabase.from('ds_tong').select('STT').range(from, from + step - 1);
        if (error) throw error;
        allSupabaseData = allSupabaseData.concat(data);
        if (data.length < step) break;
        from += step;
    }
    
    const existingSTTs = new Set(allSupabaseData.map(d => d.STT.toString()));
    console.log(`Found ${existingSTTs.size} records in Supabase.`);
    
    const workbook = xlsx.readFile("HÈ.xlsx");
    const sheet = workbook.Sheets["DS TỔNG"];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    let globalSTT = 1;
    let missingRows = [];
    
    for (let i = 4; i < rows.length; i++) {
        const row = rows[i];
        if (!row || !row[5]) { // Column 5 is LỚP
            globalSTT++;
            continue;
        }
        
        const ho = (row[1] || '').toString().trim();
        const ten = (row[2] || '').toString().trim();
        
        if (ho && ten) {
            if (!existingSTTs.has(globalSTT.toString())) {
                missingRows.push({
                    sttStr: globalSTT.toString(),
                    ho,
                    ten,
                    truong: (row[3] || '').toString().trim(),
                    ghi_chu: (row[4] || '').toString().trim(),
                    lop: (row[5] || '').toString().trim(),
                    // Subjects (indices based on headers)
                    // 17: AV, 18: TOÁN, 19: VĂN, 20: HÓA, 21: LÝ
                    toan: (row[18] || '').toString().trim(),
                    ly: (row[21] || '').toString().trim(),
                    hoa: (row[20] || '').toString().trim(),
                    van: (row[19] || '').toString().trim(),
                    av: (row[17] || '').toString().trim(),
                });
            }
        }
        globalSTT++;
    }
    
    console.log(`Found ${missingRows.length} missing students in Supabase.`);
    
    for (const s of missingRows) {
        console.log(`Restoring STT ${s.sttStr} - ${s.ho} ${s.ten} (Lớp ${s.lop})`);
        
        const { error } = await supabase.from('ds_tong').insert({
            STT: s.sttStr,
            HỌ: s.ho,
            TÊN: s.ten,
            TRƯỜNG: s.truong,
            LỚP: s.lop,
            TOÁN: s.toan,
            Lý: s.ly,
            Hóa: s.hoa,
            VĂN: s.van,
            AV: s.av,
            "Ghi chú": s.ghi_chu
        });
        
        if (error) {
            console.error(`Error restoring STT ${s.sttStr}:`, error);
        }
    }
    console.log("Done restoring!");
}

run().catch(console.error);
