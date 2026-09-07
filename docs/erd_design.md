# TÀI LIỆU THIẾT KẾ SƠ ĐỒ THỰC THỂ NGUYÊN THỂ (CONCEPTUAL ERD SPECIFICATION)
## DỰ ÁN: HỆ THỐNG QUẢN LÝ TRUNG TÂM DẠY THÊM (EDUMANAGER V2)

---

## 1. PHÂN TÍCH THỰC THỂ & THUỘC TÍNH (ENTITIES & ATTRIBUTES ANALYSIS)

Căn cứ theo tài liệu Yêu cầu Nghiệp vụ [requirements.md](file:///c:/Users/ACER/Desktop/grow/requirements.md), hệ thống bao gồm các Tập thực thể (Entity Sets) và Tập thuộc tính (Attribute Sets) chuẩn học thuật sau:

### 1.1. Thực Thể Mạnh (Strong Entities)

1. **`ACADEMIC_YEARS` (Năm Học / Niên Khóa)**:
   - `academic_year_id` (Khóa chính - Primary Key, Tự động tăng).
   - `year_name` (Tên niên khóa - Unique, VD: `2025-2026`, `2026-2027`).
   - `start_date` (Ngày bắt đầu năm học).
   - `end_date` (Ngày kết thúc năm học).
   - `is_current` (Đánh dấu năm học hiện tại hoạt động).

2. **`SUBJECTS` (Môn Học)**:
   - `subject_id` (Khóa chính - Primary Key, Tự động tăng).
   - `subject_code` (Mã môn học - Unique, VD: `TOAN`, `AV`, `VAN`).
   - `subject_name` (Tên môn học - Unique, VD: `Toán`, `Anh Văn`, `Ngữ Văn`).

3. **`TEACHERS` (Giáo Viên)**:
   - `teacher_id` (Khóa chính - Primary Key, Định danh duy nhất UUID).
   - `teacher_code` (Mã giáo viên - Unique, VD: `GV001`, `GV002`).
   - `full_name` (Họ và tên giáo viên).
   - `phone` (Số điện thoại - Thuộc tính tùy chọn / Optional).
   - `specialization_subject_id` (Liên kết môn chuyên môn).

4. **`STUDENTS` (Học Sinh)**:
   - `student_id` (Khóa chính - Primary Key, Định danh duy nhất UUID).
   - `student_code` (Mã học sinh - Unique, VD: `HS0001`).
   - `full_name` (Họ và tên học sinh).
   - `phone` (Số điện thoại liên lạc chính của gia đình).
   - `grade` (Khối học - Nhận giá trị từ Khối 1 đến Khối 12).
   - `status` (Trạng thái: `DANG_HOC`, `DA_NGHI`, `DA_TN`).
   - `notes` (Ghi chú học tập / hẹn đóng phí).

5. **`CLASSES` (Lớp Học)**:
   - `class_id` (Khóa chính - Primary Key, Định danh duy nhất UUID).
   - `class_name` (Tên lớp học, VD: `Lớp 6A - Toán`).
   - `grade` (Khối lớp - Từ 1 đến 12).
   - `academic_year` (Liên kết Niên khóa áp dụng).
   - `default_fee_rate` (Học phí gốc đơn vị mỗi đợt học).
   - `is_active` (Trạng thái lớp đang mở / đã khóa).

6. **`USERS` (Người Dùng / Phân Quyền)**:
   - `user_id` (Khóa chính - Primary Key UUID).
   - `username` (Tên đăng nhập - Unique).
   - `password_hash` (Mật khẩu đã mã hóa).
   - `full_name` (Họ tên người dùng).
   - `role` (Phân quyền nghiệp vụ: `ADMIN`, `CASHIER`, `TEACHER`).

7. **`RECEIPTS` (Biên Lai Thu Tiền Header)**:
   - `receipt_id` (Khóa chính - Primary Key UUID).
   - `receipt_code` (Mã biên lai duy nhất - Unique, VD: `BL-2026-001`).
   - `receipt_type` (Loại biên lai: `IN_MAY` hoặc `NHAP_TAY`).
   - `manual_receipt_code` (Mã biên lai cuống sổ tay bổ sung).
   - `total_amount` (Tổng tiền thực thu của toàn biên lai).
   - `receipt_date` (Ngày và giờ lập biên lai chính xác đến từng giây).

---

### 1.2. Thực Thể Yếu (Weak Entities)

1. **`BATCHES` (12 Đợt Học Theo Lớp)**:
   - Thực thể yếu phụ thuộc sự tồn tại của Lớp học (`CLASSES`).
   - Khóa bán phần (Partial Key / Discriminator): `batch_number` (Số đợt từ 1 đến 12).
   - `batch_name` (Tên đợt học, VD: `Đợt 1`, `Đợt 2`).
   - `fee_rate` (Mức học phí riêng của đợt).
   - `status` (Trạng thái đợt: `DANG_HOC`, `UPCOMING`, `COMPLETED`).
   - `teacher_id` (Giáo viên phụ trách riêng của đợt nếu có thay đổi).

2. **`RECEIPT_ITEMS` (Chi Tiết Mục Đóng Biên Lai)**:
   - Thực thể yếu phụ thuộc vào Biên lai thu tiền (`RECEIPTS`).
   - Khóa bán phần: Kết hợp `(class_id, batch_id)`.
   - `amount_paid` (Số tiền thực đóng của đợt học cụ thể).
   - `item_note` (Ghi chú dòng thu).

---

### 1.3. Mối Quan Hệ Nghiệp Vụ (Relationships & Cardinality Ratios)

1. **`ACADEMIC_YEARS` — `CLASSES` (1:N)**: Một Niên khóa có nhiều Lớp học (`1-N`). Tham gia toàn phần ở phía Lớp học.
2. **`SUBJECTS` — `CLASSES` (1:N)**: Một Môn học áp dụng cho nhiều Lớp học (`1-N`).
3. **`TEACHERS` — `CLASSES` (1:N)**: Một Giáo viên phụ trách chính nhiều Lớp học (`1-N`).
4. **`STUDENTS` — `CLASSES` (N:M)**: Học sinh ghi danh vào nhiều Lớp học và một Lớp học chứa nhiều Học sinh (Quan hệ Nhiều - Nhiều `N-M`, thể hiện qua Thực thể Trung gian `ENROLLMENTS`).
5. **`CLASSES` — `BATCHES` (1:N)**: Một Lớp học có đúng 12 Đợt học (Quan hệ Định danh Thực thể Yếu `1-N`).
6. **`TEACHERS` — `BATCHES` (1:N)**: Một Giáo viên có thể được phân công phụ trách nhiều Đợt học riêng biệt (`1-N`).
7. **`STUDENTS` — `RECEIPTS` (1:N)**: Một Học sinh sở hữu nhiều Biên lai thu tiền (`1-N`).
8. **`USERS` — `RECEIPTS` (1:N)**: Một Người dùng (Thu ngân/Admin) lập nhiều Biên lai thu tiền (`1-N`).
9. **`RECEIPTS` — `RECEIPT_ITEMS` (1:N)**: Một Biên lai chứa nhiều Chi tiết mục đóng (`1-N`).

---

## 2. SƠ ĐỒ ERD CẤU TRÚC NGUYÊN THỂ (CONCEPTUAL ERD DIAGRAM)

```mermaid
erDiagram
    ACADEMIC_YEARS ||--o{ CLASSES : "mở cho"
    SUBJECTS ||--o{ CLASSES : "thuộc môn"
    SUBJECTS ||--o{ TEACHERS : "chuyên môn"
    TEACHERS ||--o{ CLASSES : "phụ trách chính"
    TEACHERS ||--o{ BATCHES : "dạy đợt"
    
    STUDENTS ||--o{ ENROLLMENTS : "tham gia"
    CLASSES ||--o{ ENROLLMENTS : "chứa"
    
    CLASSES ||--1{ BATCHES : "sinh 12 đợt"
    
    USERS ||--o{ RECEIPTS : "lập biên lai"
    STUDENTS ||--o{ RECEIPTS : "thanh toán"
    
    RECEIPTS ||--1{ RECEIPT_ITEMS : "gồm các mục"
    CLASSES ||--o{ RECEIPT_ITEMS : "đóng cho lớp"
    BATCHES ||--o{ RECEIPT_ITEMS : "đóng cho đợt"

    ACADEMIC_YEARS {
        int academic_year_id PK
        string year_name UK
        boolean is_current
    }

    SUBJECTS {
        int subject_id PK
        string subject_code UK
        string subject_name UK
    }

    TEACHERS {
        uuid teacher_id PK
        string teacher_code UK
        string full_name
        string phone
        int specialization_subject_id FK
    }

    STUDENTS {
        uuid student_id PK
        string student_code UK
        string full_name
        string phone
        int grade
        string status
    }

    CLASSES {
        uuid class_id PK
        string class_name
        string academic_year FK
        int grade
        int subject_id FK
        uuid teacher_id FK
        decimal default_fee_rate
        boolean is_active
    }

    ENROLLMENTS {
        uuid enrollment_id PK
        uuid student_id FK
        uuid class_id FK
        timestamp enrolled_at
        string status
    }

    BATCHES {
        uuid batch_id PK
        uuid class_id FK
        int batch_number
        string batch_name
        decimal fee_rate
        string status
        uuid teacher_id FK
    }

    USERS {
        uuid user_id PK
        string username UK
        string full_name
        string role
    }

    RECEIPTS {
        uuid receipt_id PK
        string receipt_code UK
        string receipt_type
        uuid student_id FK
        uuid created_by_user_id FK
        decimal total_amount
        timestamp receipt_date
    }

    RECEIPT_ITEMS {
        uuid item_id PK
        uuid receipt_id FK
        uuid class_id FK
        uuid batch_id FK
        decimal amount_paid
    }
```

---

## 3. NGUYÊN TẮC RÀNG BUỘC TOÀN VẸN & BẢN SỐ (PARTICIPATION CONSTRAINTS)

1. **Ràng buộc Tham gia Toàn phần (Total Participation)**:
   - Mọi `BATCHES` phải thuộc về 1 `CLASSES` duy nhất (Phụ thuộc tồn tại).
   - Mọi `RECEIPT_ITEMS` phải gắn liền với 1 `RECEIPTS` cụ thể.
   - Mọi `CLASSES` phải gắn liền với 1 `ACADEMIC_YEARS` và 1 `SUBJECTS`.

2. **Ràng buộc Duy nhất (Uniqueness Rules)**:
   - Mỗi Lớp học có đúng 12 Đợt học duy nhất được đánh số từ 1 đến 12 (`UNIQUE(class_id, batch_number)`).
   - Mỗi Học sinh chỉ ghi danh active 1 lần trên 1 Lớp học trong niên khóa (`UNIQUE(student_id, class_id)`).
   - Mỗi dòng mục đóng trên Biên lai chỉ thu tiền cho đúng 1 Đợt của 1 Lớp học (`UNIQUE(receipt_id, class_id, batch_id)`).
