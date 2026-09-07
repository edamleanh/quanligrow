# TÀI LIỆU YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION)
## DỰ ÁN: HỆ THỐNG WEB QUẢN LÝ TRUNG TÂM DẠY THÊM (EDUMANAGER V2)

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1.1. Mục tiêu Hệ thống
Xây dựng ứng dụng Web quản trị nội bộ dành cho Trung tâm Dạy thêm, tập trung vào 2 trụ cột nghiệp vụ:
1. **Quản lý Học vụ**: Quản lý học sinh, giáo viên, phân công lớp học, danh sách ghi danh.
2. **Quản lý Tài chính & Công nợ**: Thu học phí theo đợt linh hoạt, lập biên lai in máy / nhập tay, theo dõi nợ phí và nhắc phí.

### 1.2. Hình thức Thanh toán
- Mặc định: **Tiền mặt (CASH)**.

### 1.3. Phân quyền Người dùng (Role-Based Access Control - RBAC)
Hệ thống phân chia 3 nhóm quyền chính:
- 👑 **Admin (Chủ trung tâm)**:
  - Toàn quyền quản trị hệ thống, quản lý tài khoản người dùng và phân quyền.
  - Cấu hình môn học, bảng giá học phí gốc.
  - Màn hình mặc định sau đăng nhập: **Dashboard Doanh thu Hôm nay** & **Thống kê Lớp có nhiều HS nợ các đợt đã học xong**.
- 💵 **Thu ngân (Cashier)**:
  - Quản lý hồ sơ học sinh và đăng ký lớp học.
  - Màn hình mặc định sau đăng nhập: **Màn hình Thu tiền POS** / **Tra cứu Học sinh**.
  - Lập biên lai thu tiền trực tiếp (`IN_MAY`) hoặc bổ sung (`NHAP_TAY`).
  - Đóng gộp nhiều môn / nhiều đợt trong 1 biên lai.
- 👨‍🏫 **Giáo viên (Teacher)**:
  - Màn hình mặc định sau đăng nhập: **Danh sách Lớp phụ trách**.
  - Xem thông tin tổng quan sĩ số, môn, khối của các lớp dạy.

### 1.4. Thương hiệu & Phong cách Giao diện (Branding & Theme)
- **Tên đơn vị**: **Trung Tâm Ngoại Ngữ Grow**
- **Phong cách Giao diện**: Giáo dục tươi tắn, **Light Mode** (Sáng thanh lịch, tối giản).
- **Màu sắc Chủ đạo**: **Xanh Emerald chuyên nghiệp** (`#059669` / `#10B981`), kết hợp với nền Slate/Nắng ấm hài hòa.
- **Chế độ Demo Quick Switcher**: Hỗ trợ thanh chuyển đổi quyền nhanh 1-Click (`Admin`, `Thu ngân`, `Giáo viên`) trên Header để test giao diện.

---

## 2. YÊU CẦU NGHIỆP VỤ & QUẢN LÝ THỰC THỂ (ENTITIES & BUSINESS RULES)

### 2.1. Danh mục Hệ thống (System Catalogs)
- **Khối (Grades)**: Cố định từ **Khối 1 đến Khối 12** (CHECK `grade BETWEEN 1 AND 12`).
- **Môn học & Mức phí mặc định**:
  - Môn thông thường (`Toán`, `Lý`, `Hóa`, `Anh Văn`, `GVNN`): Mức học phí mặc định **350.000 VNĐ / đợt**.
  - Môn `Văn` (`Ngữ Văn`): Mức học phí mặc định **300.000 VNĐ / đợt**.
  - Admin có quyền điều chỉnh học phí mặc định của môn/lớp hoặc từng đợt cụ thể.

### 2.2. Quản lý Giáo viên (Teachers)
- **Thông tin lưu trữ**:
  - Mã Giáo viên (`teacher_code`): Khóa chính / Mã duy nhất.
  - Họ và Tên (`full_name`): Chuỗi văn bản, bắt buộc.
  - Số điện thoại (`phone`): Chuỗi 10-11 chữ số, định dạng chuẩn.
  - Môn phụ trách (`specialization_subject_id`): Liên kết danh mục Môn học.

### 2.3. Quản lý Học sinh (Students)
- **Thông tin lưu trữ**:
  - Mã học sinh (`student_code`): Tự động sinh theo định dạng `HS0001`, `HS0002`...
  - Họ và Tên (`full_name`): Bắt buộc.
  - Số điện thoại (`phone`): Lưu **1 SĐT duy nhất** (SĐT liên lạc chính của gia đình/học sinh).
  - Khối hiện tại (`grade`): Từ 1 đến 12.
  - Trạng thái: `DANG_HOC` (Đang học), `DA_NGHI` (Đã nghỉ) hoặc `DA_TN` (Đã tốt nghiệp - học xong lớp 12, vd: `12N26`).
  - Ghi chú (`notes`): Văn bản tự do (hẹn ngày đóng tiền, tình trạng học tập, lưu ý đặc biệt...).

### 2.4. Quản lý Lớp học & Đợt học (Classes & Batches)
- **Mô hình Lớp học (Class Entity)**:
  - Tên lớp gắn chặt với Khối và Môn học (Ví dụ: *Lớp 6A - Toán* và *Lớp 6A - Văn* là **2 thực thể độc lập hoàn toàn**, có danh sách học sinh ghi danh riêng biệt).
  - Phân công: Mỗi lớp do **1 Giáo viên phụ trách**.
  - Đơn giá học phí gốc (`default_fee_rate`): Giá cố định cho 1 đợt học (Ví dụ: 800.000 VNĐ / đợt).
  - Trạng thái lớp (`is_active`): Đang mở hoặc Đã khóa.
- **Ghi danh (Enrollment / Class Assignment)**:
  - Gán học sinh vào danh sách lớp học (Mối quan hệ Nhiều - Nhiều giữa Học sinh và Lớp học).
  - Lưu ngày ghi danh (`enrolled_at`).
- **Đợt học (Batches / Periods)**:
  - **Tự động khởi tạo 12 Đợt**: Khi tạo mới 1 Lớp học, hệ thống **tự động sinh sẵn 12 Đợt học** (Từ *Đợt 1* đến *Đợt 12*, tương ứng `batch_number` từ 1 đến 12).
  - **Trạng thái Đợt (`batch_status`)**:
    - `DANG_HOC` (Đợt hiện tại đang học).
    - `UPCOMING` (Đợt sắp tới, chưa học).
    - `COMPLETED` (Đợt đã hoàn thành / kết thúc).
  - **Quản lý Đợt đang học**:
    - Mặc định khi khởi tạo lớp, *Đợt 1* sẽ có trạng thái `DANG_HOC`, các đợt từ 2 đến 12 có trạng thái `UPCOMING`.
    - Khi kết thúc 1 đợt học, người dùng (Admin/Thu ngân) sẽ **cập nhật bằng tay** đợt cũ sang `COMPLETED` và đợt tiếp theo sang `DANG_HOC`.
  - **Học phí từng đợt**: Mặc định kế thừa `default_fee_rate` của lớp, cho phép chỉnh sửa tiền đóng riêng cho từng đợt nếu cần.

---

## 3. LOGIC THU HỌC PHÍ, BIÊN LAI & CÔNG NỢ (PAYMENTS & DEBT LOGIC)

### 3.1. Quy tắc Lập Biên Lai & Màn hình POS (POS & Receipt Management)
- **Giao diện POS Chọn Học sinh Thông minh**:
  - Khi Thu ngân tìm kiếm và chọn 1 Học sinh:
    - Hệ thống ngay lập tức tải danh sách **Tất cả các Lớp học sinh đang ghi danh**.
    - Kèm theo danh sách **12 Đợt học** của từng lớp, hiển thị trực quan:
      - Đợt hiện tại (`DANG_HOC`): Đã đóng / Chưa đóng.
      - Các đợt quá hạn (`COMPLETED`): Còn nợ đợt nào chưa đóng.
      - Các đợt sắp tới (`UPCOMING`): Có thể chọn đóng trước.
    - Thu ngân chỉ cần click chọn 1 hoặc nhiều đợt/nhiều lớp để tự động gộp vào danh sách thanh toán.
- **Gộp nhiều mục thanh toán trên 1 Biên lai**:
  - 1 Biên lai cho phép 1 học sinh đóng tiền cho **nhiều lớp** và **nhiều đợt học** khác nhau cùng một lúc.
  - *Ví dụ*: Biên lai `#REC-2026-001` thu tiền học sinh A gồm:
    1. Lớp 6A-Toán: Đợt 1 (350.000đ)
    2. Lớp 6A-Toán: Đợt 2 (350.000đ)
    3. Lớp 6A-Văn: Đợt 1 (300.000đ)
    $\to$ **Tổng tiền biên lai**: 1.000.000 VNĐ.
- **Cảnh báo Học sinh mới / Đóng học phí lần đầu**:
  - Khi chọn đợt đóng phí cho một lớp:
    - Hệ thống tự động kiểm tra nếu đây là lần đóng đầu tiên cho lớp này.
    - Hiển thị Popup cảnh báo nhắc nhở kiểm tra giảm giá/trừ tiền học giữa chừng nếu học sinh mới vào học.
- **Phân loại Biên lai (`receipt_type`)**:
  - `IN_MAY`: Biên lai lập trực tiếp trên web và in phiếu thu máy.
  - `NHAP_TAY`: Biên lai thu bằng cuống sổ tay từ trước, nhập bổ sung vào hệ thống để đồng bộ số liệu (`manual_receipt_code`).
- **Thông tin Lưu trữ Biên lai (Receipt Audit Schema)**:
  - **Thông tin chung (Header)**: Mã biên lai, Loại biên lai (`IN_MAY` | `NHAP_TAY`), Mã biên lai tay (nếu có), Ngày lập, Người lập (User/Thu ngân), Học sinh, Tổng tiền.
  - **Chi tiết biên lai (Line Items)**: Mã Lớp, Mã Đợt, Số tiền thực thu của dòng, Ghi chú dòng.

### 3.2. Tra Cứu Công Nợ & Tình Trạng Đóng Phí (Debt Reporting)
- **Màn hình Tra cứu Công nợ theo Lớp & Đợt**:
  - Người dùng chọn `[Lớp học]` + `[Đợt học]`.
  - Hệ thống liệt kê toàn bộ học sinh đang ghi danh trong lớp đó kèm theo **Trạng thái đóng phí**:
    1. 🟢 **Đã đóng đủ (`PAID`)**: Tổng số tiền đã đóng $\ge$ Học phí quy định của đợt đó.
    2. 🟡 **Đóng thiếu (`PARTIAL`)**: Đã đóng tiền nhưng tổng số tiền $<V$ Học phí quy định của đợt.
    3. 🔴 **Chưa đóng (`UNPAID`)**: Chưa có bản ghi biên lai nào cho đợt này.
- **Bộ lọc nhanh (Quick Filter)**:
  - Lọc nhanh danh sách học sinh **Chưa đóng (`UNPAID`)** hoặc **Đóng thiếu (`PARTIAL`)** để xuất danh sách nhắc phí / nhắn tin cho phụ huynh.
