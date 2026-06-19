import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pvlyaubewwhgzhirmwgi.supabase.co';
const supabaseKey = 'sb_publishable_aBQHszEUh4jdxO7ebD9DCg_tH-Qi3kw';
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadData() {
    console.log("Loading data from firebase_data.json...");
    let data;
    try {
        const fileContent = fs.readFileSync('firebase_data.json', 'utf8');
        data = JSON.parse(fileContent);
    } catch (e) {
        console.error("Error reading firebase_data.json:", e);
        return;
    }

    const collection = Array.isArray(data) ? data : (data['ds_tong'] || data);
    if (!collection) {
        console.error("No ds_tong collection found.");
        return;
    }

    const students = Object.values(collection).map(student => {
        return {
            "STT": student["STT"] ? student["STT"].toString() : "",
            "HỌ": student["HỌ"] || "",
            "TÊN": student["TÊN"] || "",
            "NGÀY SINH": student["NGÀY SINH"] || "",
            "LỚP": student["LỚP"] || "",
            "SỐ ĐT": student["SỐ ĐT"] ? student["SỐ ĐT"].toString() : "",
            "NƠI HỌC": student["NƠI HỌC"] || "",
            "TRƯỜNG": student["TRƯỜNG"] || "",
            "TOÁN": student["TOÁN"] || "",
            "Lý": student["Lý"] || "",
            "Hóa": student["Hóa"] || "",
            "VĂN": student["VĂN"] || "",
            "AV": student["AV"] || "",
            "Ghi chú": student["Ghi chú"] || ""
        };
    }).filter(st => {
        const t = st["TÊN"] ? st["TÊN"].toString().toUpperCase() : "";
        return !t.includes("TỔNG CỘNG");
    });

    console.log(`Found ${students.length} students. Uploading in batches...`);
    
    const batchSize = 500;
    for (let i = 0; i < students.length; i += batchSize) {
        const batch = students.slice(i, i + batchSize);
        const { data: result, error } = await supabase
            .from('ds_tong')
            .insert(batch);
            
        if (error) {
            console.error(`Error uploading batch ${Math.floor(i/batchSize) + 1}:`, error.message);
        } else {
            console.log(`Uploaded batch ${Math.floor(i/batchSize) + 1}`);
        }
    }
    console.log("Done!");
}

uploadData();
