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
  - Xem báo cáo tổng quan doanh thu, thống kê nợ phí toàn trung tâm.
- 💵 **Thu ngân (Cashier)**:
  - Quản lý hồ sơ học sinh và đăng ký lớp học.
  - Lập biên lai thu tiền trực tiếp (In máy - `IN_MAY`).
  - Nhập bổ sung biên lai thu tay từ trước (`NHAP_TAY`).
  - Tra cứu tình trạng đóng phí, in phiếu thu và lọc danh sách nợ phí.
- 👨‍🏫 **Giáo viên (Teacher)**:
  - Xem danh sách học sinh thuộc các lớp do mình phụ trách.
  - Xem thông tin tổng quan của lớp học (sĩ số, môn, khối).

---

## 2. YÊU CẦU NGHIỆP VỤ & QUẢN LÝ THỰC THỂ (ENTITIES & BUSINESS RULES)

### 2.1. Danh mục Hệ thống (System Catalogs)
- **Khối (Grades)**: Cố định từ **Khối 1 đến Khối 12** (CHECK `grade BETWEEN 1 AND 12`).
- **Môn học (Subjects)**:
  - Danh mục mặc định: `Toán`, `Lý`, `Hóa`, `Văn`, `Anh Văn`, `GVNN` (Giáo viên nước ngoài).
  - Admin có quyền thêm/sửa/xóa môn học mới vào hệ thống.

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

### 3.1. Quy tắc Lập Biên Lai (Receipt Management)
- **Gộp nhiều mục thanh toán trên 1 Biên lai**:
  - 1 Biên lai cho phép 1 học sinh đóng tiền cho **nhiều lớp** và **nhiều đợt học** khác nhau cùng một lúc.
  - *Ví dụ*: Biên lai `#REC-2026-001` thu tiền học sinh A gồm:
    1. Lớp 6A-Toán: Đợt 1 (800.000đ)
    2. Lớp 6A-Toán: Đợt 2 (800.000đ)
    3. Lớp 6A-Văn: Đợt 1 (700.000đ)
    $\to$ **Tổng tiền biên lai**: 2.300.000 VNĐ.
- **Cảnh báo Học sinh mới / Đóng học phí lần đầu**:
  - Khi thu ngân thêm 1 dòng thanh toán `[Học sinh X, Lớp Y, Đợt Z]`:
    - Hệ thống tự động truy vấn lịch sử đóng tiền của `Học sinh X` tại `Lớp Y`.
    - Nếu **chưa từng có bản ghi đóng phí nào trước đó cho lớp này**, hệ thống hiển thị Popup cảnh báo:
      > ⚠️ **Cảnh báo**: Đây là lần đầu tiên học sinh đóng học phí cho lớp này. Vui lòng kiểm tra và điều chỉnh số tiền đợt đầu cho phù hợp (nếu học sinh vào học giữa chừng)!
    - Cho phép Thu ngân chủ động chỉnh sửa trực tiếp số tiền thực thu của đợt đó trên giao diện lập biên lai.
- **Phân loại Biên lai (`receipt_type`)**:
  - `IN_MAY`: Biên lai lập trực tiếp trên web và in phiếu thu máy.
  - `NHAP_TAY`: Biên lai thu bằng cuống sổ tay từ trước, nhập bổ sung vào hệ thống để đồng bộ số liệu. Yêu cầu nhập thêm ô: **"Số biên lai tay / Mã tham chiếu" (`manual_receipt_code`)**.
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
