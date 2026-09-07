# TÀI LIỆU YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENTS SPECIFICATION)
## DỰ ÁN: HỆ THỐNG WEB QUẢN LÝ TRUNG TÂM DẠY THÊM (EDUMANAGER V2)

---

## 1. TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW)

### 1.1. Mục tiêu Hệ thống
Xây dựng ứng dụng Web quản trị nội bộ dành cho Trung tâm Dạy thêm, tập trung vào 3 trụ cột nghiệp vụ:
1. **Quản lý Phân theo Niên khóa / Năm học**: Quản lý dữ liệu phân chia rõ ràng theo từng Năm học (Ví dụ: `2025-2026`, `2026-2027`...), hỗ trợ chuyển giao niên khóa, mở lớp theo năm và lưu trữ lịch sử học kỳ/năm học.
2. **Quản lý Học vụ**: Quản lý học sinh, giáo viên, phân công lớp học, danh sách ghi danh theo từng năm học.
3. **Quản lý Tài chính & Công nợ**: Thu học phí theo đợt linh hoạt, lập biên lai in máy / nhập tay, theo dõi nợ phí và báo cáo doanh thu theo từng niên khóa.

### 1.2. Hình thức Thanh toán
- Mặc định: **Tiền mặt (CASH)**.

### 1.3. Phân quyền Người dùng (Role-Based Access Control - RBAC)
Hệ thống phân chia 3 nhóm quyền chính:
- 👑 **Admin (Chủ trung tâm - Full Access)**:
  - Toàn quyền quản trị hệ thống: Dashboard Doanh thu, Báo cáo Nợ phí, Quản lý Lớp học, Đợt học, Môn học, Giáo viên và POS Thu tiền toàn trung tâm.
- 💵 **Thu ngân (Cashier - Cashier Access Only)**:
  - Lập biên lai thu tiền POS (`IN_MAY`, `NHAP_TAY`), tra cứu học sinh, lọc danh sách nợ phí và in phiếu thu toàn trung tâm.
- 👨‍🏫 **Giáo viên (Teacher - Assigned Classes Management & POS)**:
  - Quản lý các lớp do mình phụ trách: Xem sĩ số, danh sách học sinh.
  - **Thu tiền học phí cho học sinh trong lớp mình dạy**: Được phép truy cập giao diện POS thu tiền và lập biên lai thu học phí cho học sinh thuộc các lớp do mình phụ trách.

### 1.4. Thương hiệu & Phong cách Giao diện (Branding & Theme)
- **Tên đơn vị**: **Trung Tâm Ngoại Ngữ Grow**
- **Phong cách Giao diện**: Giáo dục tươi tắn, **Light Mode** (Sáng thanh lịch, tối giản).
- **Màu sắc Chủ đạo**: **Xanh Emerald chuyên nghiệp** (`#059669` / `#10B981`), kết hợp với nền Slate/Nắng ấm hài hòa.
- **Chế độ Demo Quick Switcher**: Hỗ trợ thanh chuyển đổi quyền nhanh 1-Click (`Admin`, `Thu ngân`, `Giáo viên`) trên Header để test giao diện.

---

## 2. YÊU CẦU NGHIỆP VỤ & QUẢN LÝ THỰC THỂ (ENTITIES & BUSINESS RULES)

### 2.1. Danh mục Hệ thống & Quản lý Năm học (System Catalogs & Academic Years)
- **Quản lý Phân theo Năm học (Academic Years)**:
  - Hệ thống quản lý toàn bộ dữ liệu (Lớp học, Ghi danh, Biên lai, Công nợ) phân chia rõ ràng theo từng **Năm học / Niên khóa** (Ví dụ: `2025-2026`, `2026-2027`, `2027-2028`...).
  - **Bộ lọc Năm học Toàn hệ thống**: Trên giao diện Admin & Thu ngân có thanh chọn Năm học hiện tại. Mặc định hiển thị dữ liệu của năm học hoạt động (ví dụ: `2025-2026`), khi chuyển năm học hệ thống sẽ tự động tải các lớp học và báo cáo tương ứng với niên khóa đó.
  - **Chuyển giao Niên khóa (Year-End Promotion)**: Khi sang năm học mới (ví dụ từ `2025-2026` lên `2026-2027`), Admin có thể mở danh mục Lớp học cho Năm học mới và kết chuyển/tốt nghiệp học sinh theo khối.
- **Khối (Grades)**: Cố định từ **Khối 1 đến Khối 12** (CHECK `grade BETWEEN 1 AND 12`).
- **Môn học & Mức phí mặc định**:
  - Môn thông thường (`Toán`, `Lý`, `Hóa`, `Anh Văn`, `GVNN`): Mức học phí mặc định **350.000 VNĐ / đợt**.
  - Môn `Văn` (`Ngữ Văn`): Mức học phí mặc định **300.000 VNĐ / đợt**.
  - Admin có quyền điều chỉnh học phí mặc định của môn/lớp hoặc từng đợt cụ thể.

### 2.2. Quản lý Giáo viên (Teachers)
- **Thông tin lưu trữ**:
  - Mã Giáo viên (`teacher_code`): Khóa chính / Mã duy nhất.
  - Họ và Tên (`full_name`): Chuỗi văn bản, bắt buộc.
  - Số điện thoại (`phone`): Chuỗi 10-11 chữ số, **không bắt buộc (Tùy chọn)**.
  - Môn phụ trách (`specialization_subject_id`): Chọn từ **Danh mục Môn học** (Dropdown: Toán, Lý, Hóa, Văn, Anh Văn, GVNN...).

### 2.3. Quản lý Học sinh (Students)
- **Thông tin lưu trữ**:
  - Mã học sinh (`student_code`): Tự động sinh theo định dạng `HS0001`, `HS0002`...
  - Họ và Tên (`full_name`): Bắt buộc.
  - Số điện thoại (`phone`): Lưu **1 SĐT duy nhất** (SĐT liên lạc chính của gia đình/học sinh).
  - Khối hiện tại (`grade`): Từ 1 đến 12.
  - Trạng thái: `DANG_HOC` (Đang học), `DA_NGHI` (Đã nghỉ) hoặc `DA_TN` (Đã tốt nghiệp - học xong lớp 12, vd: `12N26`).
  - Ghi chú (`notes`): Văn bản tự do (hẹn ngày đóng tiền, tình trạng học tập, lưu ý đặc biệt...).

### 2.4. Quản lý Lớp học & Đợt học theo Năm học (Classes & Batches per Academic Year)
- **Mô hình Lớp học theo Năm học (Class Entity)**:
  - Mỗi Lớp học gắn liền với một **Năm học cụ thể** (Trường `academic_year`, vd: `2025-2026`, `2026-2027`...).
  - Tên lớp gắn chặt với Khối, Môn học và Năm học (Ví dụ: *Lớp 6A - Toán (2025-2026)* và *Lớp 6A - Toán (2026-2027)* là 2 lớp học của 2 niên khóa khác nhau).
  - Phân công: Mỗi lớp do **1 Giáo viên phụ trách**.
  - Đơn giá học phí gốc (`default_fee_rate`): Giá cố định cho 1 đợt học (Ví dụ: 800.000 VNĐ / đợt).
  - Trạng thái lớp (`is_active`): Đang mở hoặc Đã khóa.
- **Ghi danh (Enrollment / Class Assignment)**:
  - Gán học sinh vào danh sách lớp học theo từng năm học (Mối quan hệ Nhiều - Nhiều giữa Học sinh và Lớp học).
  - Lưu ngày ghi danh (`enrolled_at`).
- **Đợt học (Batches / Periods)**:
  - **Tự động khởi tạo 12 Đợt**: Khi tạo mới 1 Lớp học trong năm học, hệ thống **tự động sinh sẵn 12 Đợt học** (Từ *Đợt 1* đến *Đợt 12*, tương ứng `batch_number` từ 1 đến 12).
  - **Trạng thái Đợt (`batch_status`)**:
    - `DANG_HOC` (Đợt hiện tại đang học).
    - `UPCOMING` (Đợt sắp tới, chưa học).
    - `COMPLETED` (Đợt đã hoàn thành / kết thúc).
  - **Quản lý Đợt đang học**:
    - Mặc định khi khởi tạo lớp, *Đợt 1* sẽ có trạng thái `DANG_HOC`, các đợt từ 2 đến 12 có trạng thái `UPCOMING`.
    - Khi kết thúc 1 đợt học, người dùng (Admin/Thu ngân) sẽ **cập nhật bằng tay** đợt cũ sang `COMPLETED` và đợt tiếp theo sang `DANG_HOC`.
  - **Học phí từng đợt**: Mặc định kế thừa `default_fee_rate` của lớp, cho phép chỉnh sửa tiền đóng riêng và tên đợt học cho từng đợt nếu cần.

### 2.5. Nghiệp vụ Chuyển Lớp giữa chừng & Theo dõi Công nợ Nối tiếp (Student Class Transfers)
- **Chuyển lớp học giữa chừng**:
  - Học sinh được phép xin chuyển từ lớp cũ sang lớp mới trong cùng khối/môn hoặc khác khối (Ví dụ: Chuyển từ *Lớp 6A - Toán* sang *Lớp 6B - Toán* từ Đợt 3).
- **Lưu trữ Lịch sử Chuyển lớp (`class_transfers`)**:
  - Bảng `class_transfers` lưu trữ thông tin: Học sinh (`student_id`), Lớp đi (`from_class_id`), Lớp đến (`to_class_id`), Ngày chuyển (`transfer_date`), Đợt bắt đầu ở lớp mới (`effective_batch_number`), Lý do (`reason`), Người thực hiện (`created_by_user_id`).
- **Quy tắc Xử lý Công Nợ & Thu Tiền khi Chuyển Lớp**:
  - Trạng thái ghi danh (`enrollments.status`) ở lớp cũ được đổi sang `'TRANSFERRED'`.
  - Nếu học sinh **chưa đóng tiền các đợt ở lớp cũ** (Ví dụ: Nợ Đợt 1, Đợt 2 của lớp cũ *6A-Toán*):
    - Dữ liệu nợ phí đợt cũ của lớp cũ **được giữ nguyên** và tiếp tục tính vào tổng nợ của học sinh đó.
    - Khi thu tiền, hệ thống truy vấn và hiển thị **cả danh sách nợ lớp cũ lẫn nợ lớp mới** của học sinh.
    - Biên lai thu tiền cho phép thu gộp **nợ lớp cũ + học phí lớp mới** trên 1 biên lai duy nhất (`receipt_items` ghi nhận chính xác `class_id` và `batch_id`).

### 2.6. Nghiệp vụ Phân công Giáo viên theo Đợt & Quyết toán Lương (`Teacher Assignment per Batch`)
- **Thay đổi Giáo viên phụ trách giữa các Đợt học**:
  - Trong quá trình học, một lớp học có thể thay đổi giáo viên giữa các đợt (Ví dụ: *Lớp 6A-Toán* có Đợt 1..3 do Thầy Trần Văn Anh dạy, Đợt 4..12 do Cô Nguyễn Thị Hoa dạy).
- **Lưu trữ Giáo viên theo Đợt (`batches.teacher_id` & `class_teacher_assignments`)**:
  - Bảng `batches` bổ sung trường `teacher_id` lưu giáo viên phụ trách riêng của đợt đó (Mặc định lấy theo `classes.teacher_id`).
  - Bảng `class_teacher_assignments` lưu vết lịch sử mọi lần phân công/thay đổi giáo viên theo đợt học (`assignment_id`, `class_id`, `batch_id`, `teacher_id`, `assigned_at`).
- **Thanh toán & Quyết toán Lương Giáo viên**:
  - CSDL cung cấp báo cáo `v_teacher_batch_payroll` tổng hợp tiền học phí thu được theo từng Đợt học của từng Giáo viên phụ trách.
  - Đảm bảo tiền công/thù lao được quyết toán đúng cho giáo viên thực dạy đợt đó, không bị nhầm lẫn khi lớp thay đổi giáo viên giữa chừng.

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
  - **Thông tin chung (Header)**: Mã biên lai, Loại biên lai (`IN_MAY` | `NHAP_TAY`), Mã biên lai tay (nếu có), Ngày & Giờ lập chính xác (`DD/MM/YYYY HH:mm:ss`), Người lập (User/Thu ngân), Học sinh, Tổng tiền.
  - **Chi tiết biên lai (Line Items Breakdown)**: Lịch sử biên lai phải lưu trữ và hiển thị chi tiết từng dòng thu tiền: Lớp học & Môn học, Đợt học tương ứng (VD: *Đợt 1*), và số tiền đóng của từng môn/đợt cụ thể.

### 3.2. Hiển Thị Lịch Sử Biên Lai Thu Tiền (Receipt History Display)
- **Xem Lịch sử Thu tiền tại Màn hình Chi tiết Học sinh**:
  - Bảng Lịch sử Biên lai (`tbl-page-student-receipts`) hiển thị đầy đủ:
    1. **Mã Biên lai**: Hiển thị mã duy nhất (`#REC-...`).
    2. **Ngày & Giờ Lập**: Ngày giờ đóng tiền chính xác đến từng phút/giây (`DD/MM/YYYY HH:mm:ss`).
    3. **Loại Thu**: Phân loại biên lai (`In máy` hoặc `Nhập tay`).
    4. **Chi Tiết Mục Đóng**: Danh sách hiển thị rõ ràng: *Lớp - Môn - Đợt học: Số tiền đóng từng môn* (Ví dụ: `Lớp Anh 6 (Tiếng Anh) - Đợt 1: 350.000 VNĐ`).
    5. **Tổng Tiền Thu**: Tổng cộng số tiền thực thu của toàn bộ biên lai.

### 3.3. Tra Cứu Công Nợ & Tình Trạng Đóng Phí (Debt Reporting)
- **Màn hình Tra cứu Công nợ theo Lớp & Đợt**:
  - Người dùng chọn `[Lớp học]` + `[Đợt học]`.
  - Hệ thống liệt kê toàn bộ học sinh đang ghi danh trong lớp đó kèm theo **Trạng thái đóng phí**:
    1. 🟢 **Đã đóng đủ (`PAID`)**: Tổng số tiền đã đóng $\ge$ Học phí quy định của đợt đó.
    2. 🟡 **Đóng thiếu (`PARTIAL`)**: Đã đóng tiền nhưng tổng số tiền $<V$ Học phí quy định của đợt.
    3. 🔴 **Chưa đóng (`UNPAID`)**: Chưa có bản ghi biên lai nào cho đợt này.
- **Bộ lọc nhanh (Quick Filter)**:
  - Lọc nhanh danh sách học sinh **Chưa đóng (`UNPAID`)** hoặc **Đóng thiếu (`PARTIAL`)** để xuất danh sách nhắc phí / nhắn tin cho phụ huynh.
