# EduManager Project History & Architectural Context Log

Lịch sử làm việc, bối cảnh dự án và các quyết định kiến trúc của dự án EduManager (`quanligrow`) được lưu trữ tại file này để đảm bảo không bị mất thông tin qua các phiên trao đổi.

---

## 📅 Nhật ký Tiến độ & Các Thay Đổi (Chrono Log)

### 1. Khởi tạo Dự án & Git Setup (2026-09-06)
- Clone dự án thành công từ GitHub: `https://github.com/edamleanh/quanligrow`.
- Cấu trúc ban đầu: Single-page app Vanilla JS (`script.js`), HTML5 (`index.html`), CSS (`style.css`), Express backend (`server.js`), Python export script (`fill_template.py`), Supabase CSDL table `ds_tong`.

### 2. Thiết lập Workspace Rules & Skills (`.agents/`)
- Tạo tệp [.agents/AGENTS.md](file:///c:/Users/ACER/Desktop/grow/.agents/AGENTS.md): Định nghĩa các quy chuẩn phát triển, chuẩn hóa sắp xếp tên tiếng Việt (`vnSortKey`) và sơ đồ bảng `ds_tong`.
- Tạo skill [.agents/skills/edumanager-ops/SKILL.md](file:///c:/Users/ACER/Desktop/grow/.agents/skills/edumanager-ops/SKILL.md): Hướng dẫn vận hành server local, quy trình trích xuất file Excel và các công cụ bảo trì.

### 3. Tái Cấu Trúc Tổng Thể (Refactoring Overhaul)
- **Frontend**:
  - `index.html`: Loại bỏ toàn bộ inline styles `style="..."`, chuyển sang các CSS classes chuẩn ngữ nghĩa.
  - `style.css`: Bổ sung CSS variables, utility classes, responsive layout, glassmorphism modal, badges môn học và animation mượt mà.
  - `script.js`: Tách thành 12 module chức năng sạch sẽ (State Management, Supabase API Layer, Utility Functions, Realtime Subscription, Class Grid Renderer, Class Detail View, Bulk Actions, Student Filter, Modal Controllers, Export Excel Controller).
- **Backend & Python**:
  - `server.js`: Đảm bảo an toàn đường dẫn file (`path.join(__dirname, ...)`), thêm endpoint `/api/health`, dọn dẹp file ZIP và JSON tạm tự động sau khi gửi về client.
  - `fill_template.py`: Bổ sung dọn dẹp tự động các file `.xlsx` trung gian sau khi tạo file `.zip`.
- **Tổ chức Thư mục & Scripts**:
  - Gom 15+ script bảo trì dữ liệu `.mjs` vào thư mục `tools/`.
  - Nâng cấp `package.json` với các lệnh `npm start`, `npm run dev`, `npm run export-excel`, `npm run check-data`.

### 4. Sửa lỗi & Nâng cấp Khóa / Mở khóa Lớp (Lock/Unlock Class Feature)
- **Tính năng**: Cho phép bật/tắt trạng thái lớp học.
- **Cải tiến**:
  - Thêm thông báo phản hồi pop-up tức thì (`alert` notification).
  - Cập nhật nhãn trạng thái (`[● Đang hoạt động]` màu xanh / `[🔒 Đã khóa]` màu đỏ) và đổi màu nút bấm mà không cần reload trang.
  - Đồng bộ trạng thái lớp kép (Dual Storage Sync) tới cả Express server local (`class_status.json`) lẫn Supabase row `STT = 99999` (cột `Ghi chú`).

### 5. Kế hoạch Nâng cấp Quy mô Dự án (Upcoming Scale-up Phase)
- **Mục tiêu**: Chuyển đổi từ bảng đơn phẳng `ds_tong` sang **Mô hình Cơ sở dữ liệu Quan hệ (Relational Database)** chuẩn hóa (3NF).
- **Các bước thực hiện chuẩn bị**:
  1. Tiếp nhận danh sách yêu cầu nghiệp vụ chi tiết từ người dùng.
  2. Lập tài liệu kiến trúc hệ thống (Software Architecture Document).
  3. Thiết kế sơ đồ ERD (Entity-Relationship Diagram) và chuyển đổi sang Relational Data Model.
  4. Viết SQL Schema DDL, Migration Script và nâng cấp lại toàn bộ dự án.

---

## 🔒 Thông tin Cấu trúc & CSDL Hiện tại
- **Supabase URL**: `https://pvlyaubewwhgzhirmwgi.supabase.co`
- **Bảng CSDL hiện tại**: `ds_tong`
- **Cấu hình dòng đặc biệt**: `STT = 99999` (lưu JSON trạng thái lớp `classStatusMap` trong cột `Ghi chú`).
- **Server Local**: Express server chạy trên cổng `http://localhost:3005`.
