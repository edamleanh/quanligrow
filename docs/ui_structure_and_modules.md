# MÔ TẢ CHI TIẾT GIAO DIỆN & CÁC MODULE HỆ THỐNG EDUMANAGER V2
## (System UI Architecture & Module Specification)

> **Dự án**: Hệ Thống Web Quản Lý Trung Tâm Dạy Thêm (EduManager V2)  
> **Thương hiệu**: Trung Tâm Ngoại Ngữ Grow  
> **Phong cách Giao diện**: Modern Light Mode, màu chủ đạo **Emerald Green (`#059669` / `#10B981`)**  
> **Kiến trúc Routing**: Single Page Application (SPA) Hash Routing (`/#/dashboard`, `/#/students`, `/#/classes`, `/#/teachers`, `/#/pos`)

---

## 1. KHUNG GIAO DIỆN CHUNG & THANH ĐIỀU HƯỚNG (GLOBAL LAYOUT & NAVIGATION)

### 1.1. Thanh Header Hệ thống (Global Header Bar)
- **Thương hiệu Trung tâm**: Logo & Tên **"Trung Tâm Ngoại Ngữ Grow"** màu xanh Emerald.
- **Thanh Chuyển Quyền Nhanh 1-Click (Demo Quick Role Switcher)**:
  - 👑 **Admin**: Xem toàn bộ tính năng, quản lý lớp, giáo viên, học sinh, niên khóa và báo cáo.
  - 💵 **Thu Ngân (Cashier)**: Chuyên trách POS thu tiền, tra cứu nợ phí và in biên lai.
  - 👨‍🏫 **Giáo Viên (Teacher)**: Quản lý danh sách lớp mình phụ trách và POS thu học phí cho học sinh trong lớp mình dạy.
- **Bộ Lọc Phân Theo Năm Học (Academic Year Filter)**: Dropdown chọn năm học hiện tại (ví dụ: `2025-2026`, `2026-2027`), tự động đồng bộ tất cả dữ liệu lớp học, ghi danh và báo cáo trên toàn ứng dụng.

### 1.2. Thanh Menu Bên (Sidebar Navigation)
Thanh điều hướng cố định bên trái giúp chuyển đổi giữa các module chính:
1. 📊 **Dashboard (Tổng Quan)** (`/#/dashboard`)
2. 👨‍🎓 **Quản Lý Học Sinh** (`/#/students`)
3. 🏫 **Quản Lý Lớp Học** (`/#/classes`)
4. 👨‍🏫 **Quản Lý Giáo Viên** (`/#/teachers`)
5. 💳 **POS Thu Tiền Học Phí** (`/#/pos`)

---

## 2. CHI TIẾT CÁC MODULE GIAO DIỆN (DETAILED MODULE SPECIFICATIONS)

---

### MODULE 1: DASHBOARD (TỔNG QUAN DOANH THU & HỌC VỤ)
- **Mục tiêu**: Cung cấp bức tranh toàn cảnh về doanh thu, sĩ số học sinh và tình trạng lớp học.
- **Đường dẫn URL**: `/#/dashboard`

#### Các Thành Phần Giao Diện:
1. **4 Thẻ Chỉ Số Tổng Quan (Metric Summary Cards)**:
   - **Doanh thu hôm nay (VNĐ)**: Tổng số tiền thu được từ các biên lai lập trong ngày.
   - **Tổng số học sinh**: Tổng số học sinh trong hệ thống (phân loại đang học / đã tốt nghiệp).
   - **Số lớp đang hoạt động**: Tổng số lớp đang mở trong năm học hiện tại.
   - **Số lớp đã hoàn thành/khóa**: Số lớp học đã kết thúc đợt học.
2. **Bảng Lớp Học Kết Thúc Cần Thu Nợ (Unpaid Completed Classes)**:
   - Hiển thị danh sách các lớp đã kết thúc đợt học nhưng vẫn còn học sinh chưa hoàn thành công nợ.
   - Nút thao tác nhanh để truy cập POS hoặc gửi thông báo nhắc phí.

---

### MODULE 2: QUẢN LÝ HỌC SINH (STUDENTS MANAGEMENT)
- **Mục tiêu**: Quản lý hồ sơ học sinh, danh sách ghi danh lớp học và lịch sử biên lai thu tiền.
- **Đường dẫn URL**: 
  - Danh sách: `/#/students`
  - Chi tiết full-page: `/#/students/detail?id=[student_id]`

#### Giao Diện 1: Trang Danh Sách Học Sinh (`/#/students`)
- **Thanh Công Cụ (Toolbar)**:
  - Ô tìm kiếm đa năng: Tìm theo **Họ tên**, **Số điện thoại**, hoặc **Mã học sinh**.
  - Nút `+ Thêm Mới Học Sinh`: Mở Popup Form tạo học sinh mới.
- **Bảng Danh Sách Học Sinh (`tbl-students-body`)**:
  - **Mã HS**: Định dạng tự động (`HS0001`, `HS0002`...).
  - **Họ và Tên**: Tên học sinh in đậm nổi bật.
  - **Khối**: Badge hiển thị Khối học (Khối 1 đến Khối 12).
  - **Các Lớp Đang Học**: Danh sách các Badge tên lớp học sinh đang đăng ký.
  - **Trạng Thái Học Sinh**: 
    - 🟢 `Đang học` (có lớp active).
    - 🟡 `Chưa có lớp` (chưa gán lớp).
    - 🟣 `Đã tốt nghiệp` (đã học xong khối 12).
  - **Thao tác**: Nút `Xem Trang Chi Tiết` (dẫn tới trang chi tiết đầy đủ).

#### Giao Diện 2: Trang Chi Tiết Học Sinh Full-Page (`/#/students/detail?id=...`)
- **Card Thông Tin Cá Nhân (Profile Card)**:
  - Tên học sinh lớn, Mã HS, Số điện thoại duy nhất, Khối, Trường học, Ghi chú.
  - Nút `Sửa Thông Tin Cá Nhân`: Mở Modal cập nhật thông tin.
- **Hệ Thống Tab Chi Tiết**:
  - **Tab 1: Lớp Đã Ghi Danh (`tab-page-student-enrolled`)**:
    - Bảng hiển thị các lớp học sinh đã và đang đăng ký.
    - Cột: *Tên Lớp | Học Phí Gốc/Đợt | Ngày Đăng Ký | Trạng Thái Ghi Danh (`Đang Học`, `Đã Rút Lớp`)*.
  - **Tab 2: Lịch Sử Biên Lai Thu Tiền (`tab-page-student-receipts`)**:
    - Bảng chi tiết toàn bộ các biên lai đã thu của học sinh.
    - **Cột 1 - Mã Biên Lai**: Mã duy nhất (`BL-2026-...` hoặc `REC-...`).
    - **Cột 2 - Ngày & Giờ Lập**: Thời gian đóng tiền chính xác đến từng giây (`HH:mm:ss DD/MM/YYYY`).
    - **Cột 3 - Loại Thu**: Badge `In Máy` hoặc `Nhập Tay`.
    - **Cột 4 - Chi Tiết Mục Đóng (Line Items)**: Hiển thị danh sách rõ ràng từng dòng:
      - *Ví dụ*: `Lớp 8B - Toán (Toán) - Đợt 1: 350.000 VNĐ`
      - *Ví dụ*: `Lớp 8A - Anh Văn (Anh Văn) - Đợt 1: 200.000 VNĐ`
    - **Cột 5 - Tổng Tiền Thu**: Tổng cộng tiền thực thu trên biên lai (VNĐ).
    - **Cột 6 - Mã Tay / Ghi Chú**: Mã biên lai sổ tay (nếu nhập bổ sung).

---

### MODULE 3: QUẢN LÝ LỚP HỌC (CLASSES MANAGEMENT)
- **Mục tiêu**: Quản lý danh mục lớp học theo từng năm học, phân công giáo viên và điều chỉnh 12 đợt học.
- **Đường dẫn URL**: 
  - Danh sách: `/#/classes`
  - Chi tiết full-page: `/#/classes/detail?id=[class_id]`

#### Giao Diện 1: Trang Danh Sách Lớp Học (`/#/classes`)
- **Thanh Công Cụ (Toolbar)**:
  - Ô tìm kiếm theo Tên Lớp, Tên Giáo viên.
  - Bộ lọc **Năm Học**: Lọc lớp theo niên khóa chọn (`2025-2026`, `2026-2027`...).
  - Nút `+ Tạo Lớp Học Mới`: Mở Form tạo lớp. Khi tạo mới 1 lớp, hệ thống **tự động sinh sẵn 12 Đợt học** (Đợt 1 đến Đợt 12).
- **Bảng Danh Sách Lớp Học (`tbl-classes-body`)**:
  - **Tên Lớp**: Tên lớp học (VD: *Lớp 6A - Toán (2025-2026)*).
  - **Môn Học & Khối**: Tên môn và khối học.
  - **Năm Học**: Niên khóa áp dụng.
  - **Giáo Viên Phụ Trách**: Họ tên giáo viên phụ trách chính.
  - **Học Phí Gốc (.000 VNĐ)**: Đơn vị ngàn (VD: `350` = `350.000 VNĐ`).
  - **Trạng Thái**: Badge `Đang Mở` hoặc `Đã Khóa`.
  - **Thao tác**: Nút `Xem Chi Tiết Lớp` để vào trang quản lý 12 đợt học & danh sách học sinh.

#### Giao Diện 2: Trang Chi Tiết Lớp Học Full-Page (`/#/classes/detail?id=...`)
- **Card Tổng Quan Lớp**:
  - Tên lớp, Môn học, Khối, Năm học, Giáo viên phụ trách, Học phí mặc định/đợt.
  - Nút `Chỉnh Sửa Thông Tin Lớp`.
- **Hệ Thống Tab Chi Tiết**:
  - **Tab 1: Quản Lý 12 Đợt Học (`tab-page-class-batches`)**:
    - Bảng hiển thị đủ 12 Đợt học của lớp.
    - Cột: *Số Đợt (1..12) | Tên Đợt Học (cho phép đổi tên) | Học Phí Đợt (.000 VNĐ, cho phép sửa) | Trạng Thái Đợt (`ĐANG HỌC`, `UPCOMING`, `COMPLETED`) | Giáo Viên Đợt | Thao Tác (Sửa Đợt)*.
  - **Tab 2: Danh Sách Học Sinh Trong Lớp (`tab-page-class-roster`)**:
    - Hiển thị tổng sĩ số học sinh ghi danh trong lớp.
    - Bảng danh sách học sinh: Mã HS, Họ tên, SĐT, Ngày ghi danh, Trạng thái đóng phí đợt hiện tại.

---

### MODULE 4: QUẢN LÝ GIÁO VIÊN (TEACHERS MANAGEMENT)
- **Mục tiêu**: Quản lý danh sách giáo viên, môn chuyên môn và báo cáo quyết toán thù lao theo đợt học.
- **Đường dẫn URL**: 
  - Danh sách: `/#/teachers`
  - Chi tiết full-page: `/#/teachers/detail?id=[teacher_id]`

#### Giao Diện 1: Trang Danh Sách Giáo Viên (`/#/teachers`)
- **Thanh Công Cụ (Toolbar)**:
  - Ô tìm kiếm theo Tên Giáo viên, Số điện thoại, Môn phụ trách.
  - Nút `+ Thêm Mới Giáo Viên`: Mở Modal nhập thông tin giáo viên (Số điện thoại không bắt buộc, Môn chuyên môn chọn từ danh sách Dropdown).
- **Bảng Danh Sách Giáo Viên (`tbl-teachers-body`)**:
  - **Mã GV**: Định dạng duy nhất (`GV0001`, `GV0002`...).
  - **Họ và Tên**: Tên giáo viên.
  - **Số Điện Thoại**: SĐT liên lạc (hiển thị *"Chưa có SĐT"* nếu để trống).
  - **Môn Chuyên Môn**: Tên môn dạy chọn từ danh mục chuẩn (Toán, Lý, Hóa, Văn, Anh Văn, GVNN...).
  - **Lớp Phụ Trách**: Số lượng lớp đang phụ trách.
  - **Thao tác**: Nút `Xem Trang Chi Tiết` / `Sửa`.

#### Giao Diện 2: Trang Chi Tiết Giáo Viên Full-Page (`/#/teachers/detail?id=...`)
- **Card Thông Tin Giáo Viên**:
  - Họ tên, Mã GV, SĐT, Email, Môn chuyên môn.
- **Hệ Thống Tab Chi Tiết**:
  - **Tab 1: Lớp Đang & Đã Phụ Trách (`tab-page-teacher-classes`)**:
    - Danh sách toàn bộ các lớp học và đợt học mà giáo viên này phân công dạy.
  - **Tab 2: Báo Cáo Thù Lao & Doanh Thu Đợt (Payroll) (`tab-page-teacher-payroll`)**:
    - Báo cáo tổng hợp số tiền thu được theo từng Đợt học mà giáo viên thực dạy (dựa trên dữ liệu view `v_teacher_batch_payroll`).

---

### MODULE 5: POS THU TIỀN HỌC PHÍ (POS PAYMENTS & RECEIPT ISSUANCE)
- **Mục tiêu**: Màn hình thu tiền nhanh dành cho Thu ngân & Giáo viên, hỗ trợ chọn nhiều lớp/nhiều đợt, điều chỉnh tiền đóng đơn vị ngàn, và tra cứu nợ phí.
- **Đường dẫn URL**: `/#/pos`

#### Các Khung Chức Năng Trên Màn Hình POS:
1. **Khung 1: Tìm Kiếm & Chọn Học Sinh**:
   - Ô tìm kiếm thông minh tự động gợi ý theo Tên / SĐT / Mã HS.
   - Khi chọn học sinh: Hiển thị thông tin tên, mã HS, SĐT.
   - **Cảnh báo Học sinh mới / Lần đầu đóng phí**: Banner màu vàng/cam nhắc nhở kiểm tra giảm giá hoặc trừ tiền nếu học sinh mới vào giữa chừng.
2. **Khung 2: Danh Sách Đợt Học Phân Theo Lớp**:
   - Gom nhóm trực quan theo từng **Lớp học sinh đang đăng ký**.
   - Hiển thị danh sách **12 Đợt học** với màu sắc dễ phân biệt:
     - 🟢 **Đã đóng (`PAID`)**: Đã thu đủ học phí.
     - 🟡 **Đợt hiện tại (`DANG_HOC`)**: Đợt đang diễn ra.
     - 🔵 **Sắp tới (`UPCOMING`)**: Đợt chưa học, có thể đóng trước.
     - 🔴 **Chưa đóng / Nợ (`UNPAID`)**: Các đợt quá hạn chưa hoàn thành.
   - **Ô Nhập Học Phí Tùy Chỉnh (.000 VNĐ)**: Cho phép sửa nhanh tiền thu của từng đợt ngay tại ô nhập liệu (VD: `350` = `350.000 VNĐ`).
3. **Khung 3: Lập Biên Lai & In Phiếu Thu**:
   - Chọn Loại biên lai: `In Máy` (BL-2026-XXXX) hoặc `Nhập Tay` (nhập mã cuống sổ).
   - Tự động cộng tổng tiền các đợt/lớp được tích chọn.
   - Nút `Xác Nhận Thu Tiền & In Phiếu Thu`: Lưu biên lai vào CSDL và mở Modal in phiếu thu.
4. **Tab 2 POS: Tra Cứu Báo Cáo Nợ Phí (Debt Report - `tab-pos-debt-report`)**:
   - Bộ lọc chọn **[Lớp học]** + **[Đợt học]**.
   - Bảng tổng hợp trạng thái đóng phí của học sinh: `Đã đóng đủ`, `Đóng thiếu`, `Chưa đóng`.

---

## 3. BẢNG TỔNG HỢP CÁC POPUP / MODAL TRONG HỆ THỐNG

| STT | Tên Modal / Popup | Mã HTML ID | Chức Năng Chính |
| :--- | :--- | :--- | :--- |
| 1 | Form Học Sinh | `modal-student-form` | Thêm mới / Chỉnh sửa thông tin học sinh |
| 2 | Form Lớp Học | `modal-class-form` | Tạo lớp mới & tự động sinh 12 Đợt học |
| 3 | Form Giáo Viên | `modal-teacher-form` | Thêm mới / Chỉnh sửa thông tin giáo viên |
| 4 | Sửa Đợt Học | `modal-batch-form` | Đổi tên đợt & điều chỉnh học phí đợt |
| 5 | In Biên Lai POS | `modal-print-receipt` | Hiển thị phiếu thu chuẩn in máy cho phụ huynh |

---
*Tài liệu được trích xuất và cập nhật tự động từ cấu trúc giao diện thực tế của EduManager V2.*
