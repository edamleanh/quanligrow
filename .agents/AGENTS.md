# EduManager Project Guidelines & Rules

## 1. Project Overview
- **Name**: EduManager (`quanligrow`)
- **Domain**: Supplementary education student & class management system (Quản lý Học sinh & Lớp học cho các môn: Toán, Văn, Anh Văn, Hóa, Lý).
- **Stack**: 
  - Frontend: Vanilla HTML5, CSS3, JavaScript (ES6+), Supabase JS SDK v2.
  - Backend: Node.js (Express), Vercel Serverless Functions (`api/class-status.js`, `api/export.py`).
  - Data Export: Python (`openpyxl`, `zipfile`).
  - Database: Supabase PostgreSQL (`ds_tong` table).

## 2. Database Schema (`ds_tong`)
- `id` (UUID or Serial Primary Key)
- `STT` (String / Integer - Student ordering key; Special row `STT = 99999` is reserved for system configuration `classStatusMap`)
- `HỌ` (String - Student last/middle name)
- `TÊN` (String - Student first name)
- `LỚP` (String - Grade number, e.g., "6", "7", "8", "9", "10", "11", "12")
- `SỐ ĐT` (String - Phone number)
- `TOÁN`, `VĂN`, `AV`, `Hóa`, `Lý` (String - Sub-class code, e.g., "A", "B", "A1"; empty string if not enrolled)
- `Ghi chú` (String - Extra notes; contains JSON config for system row STT `99999`)

## 3. Code Standards & Guidelines
- **Vietnamese Sorting (`vnSortKey`)**: Always use Vietnamese alphabetical ordering (`a á à ả ã ạ ă ắ ằ ... đ ... z`) for sorting student names by `TÊN` first, then `HỌ`.
- **Class Naming & Sorting**:
  - Class name pattern: `${LỚP}${MÔN_VAL}` (e.g. `6A`, `7B1`).
  - Sorting order: Grade ascending (6 -> 12) -> Class suffix numerical/alphabetical.
- **Frontend Code Structure**:
  - Keep JS modular with distinct layers: API Service, State Manager, UI Renderers, Utilities, Event Controllers.
  - Do not pollute global namespace. Use clean scoped modules or clear structured modules.
  - All styling should reside in `style.css` - avoid inline `style="..."` attributes in `index.html`.
- **Backend & Scripts**:
  - Always use `path.join(__dirname, ...)` for file path resolution in Node.js.
  - Gracefully clean up temporary files (`firebase_data.json`, `DanhSachTruatXuat.zip`).
