import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import xlsx from "xlsx";

const firebaseConfig = {
  apiKey: "AIzaSyDPiqc3dNswOu8TvarTVBib7iti2hk4N9A",
  authDomain: "trung-tam-8a330.firebaseapp.com",
  projectId: "trung-tam-8a330",
  storageBucket: "trung-tam-8a330.firebasestorage.app",
  messagingSenderId: "1031924290463",
  appId: "1:1031924290463:web:442e490a4d06f0c88f23aa",
  measurementId: "G-KTZEW8376M"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Reading excel file...");
    const workbook = xlsx.readFile("HÈ.xlsx");
    const sheetName = "DS TỔNG";
    
    if (!workbook.Sheets[sheetName]) {
        console.error("Sheet not found.");
        process.exit(1);
    }

    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    const headers = rows[2]; // Index 2 is the actual header row
    
    // Clean headers: remove undefined/null/empty and newlines
    const cleanHeaders = headers.map(h => h ? h.toString().replace(/\r\n/g, " ").trim() : "UNKNOWN");
    
    const data = [];
    // Start reading from row 4 (index 4)
    for (let i = 4; i < rows.length; i++) {
        const rowArray = rows[i];
        if (!rowArray || rowArray.length === 0) continue; // Skip empty rows
        
        // Only include if STT or HỌ or TÊN is present
        if (!rowArray[0] && !rowArray[1] && !rowArray[2]) continue;
        
        const obj = {};
        for (let j = 0; j < cleanHeaders.length; j++) {
            if (cleanHeaders[j] !== "UNKNOWN") {
                obj[cleanHeaders[j]] = rowArray[j] !== undefined ? rowArray[j] : "";
            }
        }
        data.push(obj);
    }

    console.log(`Found ${data.length} clean records. Starting upload to 'ds_tong' collection...`);
    
    let successCount = 0;
    const collRef = collection(db, "ds_tong");
    
    for (let i = 0; i < data.length; i++) {
        try {
            await addDoc(collRef, data[i]);
            successCount++;
            if (successCount % 50 === 0) {
                console.log(`Uploaded ${successCount}/${data.length} records...`);
            }
        } catch (e) {
            console.error(`Error uploading record ${i}:`, e);
        }
    }
    
    console.log(`Upload complete! Success: ${successCount}`);
    process.exit(0);
}

run().catch(console.error);
