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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function run() {
    console.log("Reading excel file...");
    const workbook = xlsx.readFile("HÈ.xlsx");
    const sheetName = "DS TỔNG";
    
    if (!workbook.Sheets[sheetName]) {
        console.error("Sheet 'DS tổng' not found. Available sheets:", workbook.SheetNames);
        process.exit(1);
    }

    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    console.log(`Found ${data.length} records in sheet '${sheetName}'.`);
    
    if (data.length === 0) {
        console.log("No data to upload.");
        process.exit(0);
    }

    console.log("Starting upload to Firestore collection 'students'...");
    
    let successCount = 0;
    let errorCount = 0;
    
    // We upload one by one to avoid overwhelming rate limits for a simple script
    const collRef = collection(db, "students");
    
    for (let i = 0; i < data.length; i++) {
        try {
            await addDoc(collRef, data[i]);
            successCount++;
            if (successCount % 10 === 0) {
                console.log(`Uploaded ${successCount}/${data.length} records...`);
            }
        } catch (e) {
            console.error(`Error uploading record ${i}:`, e);
            errorCount++;
        }
    }
    
    console.log(`Upload complete! Success: ${successCount}, Errors: ${errorCount}`);
    process.exit(0);
}

run().catch(err => {
    console.error("Error:", err);
    process.exit(1);
});
