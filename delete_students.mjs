import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, writeBatch } from "firebase/firestore";

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

async function deleteCollection() {
    console.log("Đang lấy danh sách các bản ghi trong collection 'students'...");
    const collRef = collection(db, "students");
    const snapshot = await getDocs(collRef);
    
    if (snapshot.empty) {
        console.log("Collection 'students' đã trống, không có gì để xóa.");
        process.exit(0);
    }
    
    console.log(`Tìm thấy ${snapshot.size} bản ghi. Đang tiến hành xóa...`);
    
    // Xóa theo batch (mỗi batch tối đa 500 thao tác)
    const batches = [];
    let currentBatch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach((doc) => {
        currentBatch.delete(doc.ref);
        count++;
        
        if (count % 500 === 0) {
            batches.push(currentBatch.commit());
            currentBatch = writeBatch(db);
        }
    });
    
    // Commit the remaining batch if it has any operations
    if (count % 500 !== 0) {
        batches.push(currentBatch.commit());
    }
    
    await Promise.all(batches);
    console.log("Đã xóa toàn bộ dữ liệu thừa trong collection 'students'!");
    process.exit(0);
}

deleteCollection().catch(console.error);
