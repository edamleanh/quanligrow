const xlsx = require('xlsx');

function exportHoaSheet() {
    console.log("Đang đọc file HÈ.xlsx...");
    const workbook = xlsx.readFile('HÈ.xlsx');
    
    // Tìm sheet HOÁ (hoặc Hóa tùy theo cách viết hoa/thường)
    const sheetName = workbook.SheetNames.find(name => name.toUpperCase() === 'HOÁ' || name.toUpperCase() === 'HÓA');
    
    if (!sheetName) {
        console.error("Không tìm thấy sheet tên 'HOÁ' trong file.");
        console.log("Các sheet hiện có:", workbook.SheetNames);
        process.exit(1);
    }
    
    console.log(`Đã tìm thấy sheet: ${sheetName}. Đang tách ra file mới...`);
    
    // Tạo một workbook mới
    const newWorkbook = xlsx.utils.book_new();
    
    // Lấy sheet HOÁ từ file gốc
    const hoaSheet = workbook.Sheets[sheetName];
    
    // Thêm sheet đó vào workbook mới
    xlsx.utils.book_append_sheet(newWorkbook, hoaSheet, sheetName);
    
    // Lưu workbook mới thành file excel riêng
    const newFileName = 'HOA_Rieng.xlsx';
    xlsx.writeFile(newWorkbook, newFileName);
    
    console.log(`Đã tách thành công! File mới được lưu với tên: ${newFileName}`);
}

exportHoaSheet();
