# TÀI LIỆU MÔ HÌNH QUAN HỆ & CHỨNG MINH DẠNG CHUẨN (RELATIONAL DATA MODEL & 3NF PROOF)
## DỰ ÁN: EDUMANAGER V2 (QUẢN LÝ TRUNG TÂM DẠY THÊM)

---

## 1. MÔ HÌNH DỮ LIỆU QUAN HỆ (RELATIONAL DATA MODEL SCHEMAS)

Áp dụng 7 Quy tắc chuyển đổi chuẩn Elmasri & Navathe từ sơ đồ ERD [docs/erd_design.md](file:///c:/Users/ACER/Desktop/grow/docs/erd_design.md), mô hình quan hệ của hệ thống gồm 9 bảng được quy định như sau:

### 1. `users` (Tài khoản người dùng & Phân quyền)
- **Schema**: `users(<u>user_id</u>, username, password_hash, full_name, role, created_at)`
- **Khoản ràng buộc**:
  - `user_id`: Primary Key (UUID).
  - `username`: Unique, NOT NULL.
  - `role`: CHECK (`role IN ('ADMIN', 'CASHIER', 'TEACHER')`).

### 2. `subjects` (Danh mục Môn học)
- **Schema**: `subjects(<u>subject_id</u>, subject_code, subject_name, created_at)`
- **Khoản ràng buộc**:
  - `subject_id`: Primary Key (SERIAL/INT).
  - `subject_code`: Unique, NOT NULL.
  - `subject_name`: Unique, NOT NULL.

### 3. `teachers` (Hồ sơ Giáo viên)
- **Schema**: `teachers(<u>teacher_id</u>, teacher_code, full_name, phone, specialization_subject_id, created_at)`
- **Khoản ràng buộc**:
  - `teacher_id`: Primary Key (UUID).
  - `teacher_code`: Unique, NOT NULL.
  - `phone`: CHECK (`phone ~ '^[0-9]{10,11}$'`).
  - `specialization_subject_id`: Foreign Key $\to$ `subjects(subject_id)` ON DELETE RESTRICT.

### 4. `students` (Hồ sơ Học sinh)
- **Schema**: `students(<u>student_id</u>, student_code, full_name, phone, grade, status, notes, created_at)`
- **Khoản ràng buộc**:
  - `student_id`: Primary Key (UUID).
  - `student_code`: Unique, NOT NULL (vd: `HS0001`).
  - `phone`: Single primary contact phone, CHECK (`phone ~ '^[0-9]{10,11}$'`).
  - `grade`: CHECK (`grade BETWEEN 1 AND 12`).
  - `status`: CHECK (`status IN ('DANG_HOC', 'DA_NGHI', 'DA_TN')`).

### 5. `classes` (Danh mục Lớp học)
- **Schema**: `classes(<u>class_id</u>, class_name, grade, subject_id, teacher_id, default_fee_rate, is_active, created_at)`
- **Khoản ràng buộc**:
  - `class_id`: Primary Key (UUID).
  - `grade`: CHECK (`grade BETWEEN 1 AND 12`).
  - `subject_id`: Foreign Key $\to$ `subjects(subject_id)` ON DELETE RESTRICT.
  - `teacher_id`: Foreign Key $\to$ `teachers(teacher_id)` ON DELETE RESTRICT.
  - `default_fee_rate`: CHECK (`default_fee_rate >= 0`).

### 6. `enrollments` (Ghi danh Học sinh vào Lớp)
- **Schema**: `enrollments(<u>enrollment_id</u>, student_id, class_id, enrolled_at, status)`
- **Khoản ràng buộc**:
  - `enrollment_id`: Primary Key (UUID).
  - `student_id`: Foreign Key $\to$ `students(student_id)` ON DELETE CASCADE.
  - `class_id`: Foreign Key $\to$ `classes(class_id)` ON DELETE CASCADE.
  - **Unique Constraint**: `UNIQUE(student_id, class_id)` (Một học sinh chỉ được ghi danh 1 lần vào 1 lớp).

### 7. `batches` (12 Đợt học theo Lớp)
- **Schema**: `batches(<u>batch_id</u>, class_id, batch_number, batch_name, fee_rate, status, created_at)`
- **Khoản ràng buộc**:
  - `batch_id`: Primary Key (UUID).
  - `class_id`: Foreign Key $\to$ `classes(class_id)` ON DELETE CASCADE.
  - `batch_number`: CHECK (`batch_number BETWEEN 1 AND 12`).
  - `fee_rate`: CHECK (`fee_rate >= 0`).
  - `status`: CHECK (`status IN ('DANG_HOC', 'UPCOMING', 'COMPLETED')`).
  - **Unique Constraint**: `UNIQUE(class_id, batch_number)` (Mỗi lớp có đúng 12 đợt học số từ 1 đến 12).

### 8. `receipts` (Biên lai Thu tiền Header)
- **Schema**: `receipts(<u>receipt_id</u>, receipt_code, receipt_type, manual_receipt_code, student_id, created_by_user_id, total_amount, receipt_date, created_at)`
- **Khoản ràng buộc**:
  - `receipt_id`: Primary Key (UUID).
  - `receipt_code`: Unique, NOT NULL (vd: `REC-2026-0001`).
  - `receipt_type`: CHECK (`receipt_type IN ('IN_MAY', 'NHAP_TAY')`).
  - `student_id`: Foreign Key $\to$ `students(student_id)` ON DELETE RESTRICT.
  - `created_by_user_id`: Foreign Key $\to$ `users(user_id)` ON DELETE RESTRICT.
  - `total_amount`: CHECK (`total_amount >= 0`).

### 9. `receipt_items` (Chi tiết Dòng Biên lai)
- **Schema**: `receipt_items(<u>item_id</u>, receipt_id, class_id, batch_id, amount_paid, item_note)`
- **Khoản ràng buộc**:
  - `item_id`: Primary Key (UUID).
  - `receipt_id`: Foreign Key $\to$ `receipts(receipt_id)` ON DELETE CASCADE.
  - `class_id`: Foreign Key $\to$ `classes(class_id)` ON DELETE RESTRICT.
  - `batch_id`: Foreign Key $\to$ `batches(batch_id)` ON DELETE RESTRICT.
  - `amount_paid`: CHECK (`amount_paid >= 0`).
  - **Unique Constraint**: `UNIQUE(receipt_id, class_id, batch_id)`.

### 10. `class_transfers` (Lịch sử Chuyển Lớp)
- **Schema**: `class_transfers(<u>transfer_id</u>, student_id, from_class_id, to_class_id, transfer_date, effective_batch_number, reason, created_by_user_id)`
- **Khoản ràng buộc**:
  - `transfer_id`: Primary Key (UUID).
  - `student_id`: Foreign Key $\to$ `students(student_id)` ON DELETE CASCADE.
  - `from_class_id`: Foreign Key $\to$ `classes(class_id)` ON DELETE RESTRICT.
  - `to_class_id`: Foreign Key $\to$ `classes(class_id)` ON DELETE RESTRICT.
  - `effective_batch_number`: CHECK (`effective_batch_number BETWEEN 1 AND 12`).
  - `created_by_user_id`: Foreign Key $\to$ `users(user_id)` ON DELETE RESTRICT.

### 11. `class_teacher_assignments` (Phân công Giáo viên theo Đợt)
- **Schema**: `class_teacher_assignments(<u>assignment_id</u>, class_id, batch_id, teacher_id, assigned_at, note)`
- **Khoản ràng buộc**:
  - `assignment_id`: Primary Key (UUID).
  - `class_id`: Foreign Key $\to$ `classes(class_id)` ON DELETE CASCADE.
  - `batch_id`: Foreign Key $\to$ `batches(batch_id)` ON DELETE CASCADE.
  - `teacher_id`: Foreign Key $\to$ `teachers(teacher_id)` ON DELETE RESTRICT.
  - **Unique Constraint**: `UNIQUE(batch_id)` (Mỗi đợt của 1 lớp chỉ do đúng 1 Giáo viên phụ trách tại một thời điểm).

---

## 2. PHÂN TÍCH CHỨNG MINH DẠNG CHUẨN (NORMALIZATION PROOF)

### 2.1. Kiểm tra Dạng Chuẩn 1 (1NF - First Normal Form)
- **Điều kiện**: Tất cả các thuộc tính trong mọi quan hệ đều mang giá trị nguyên tố (Atomic values), không chứa thuộc tính đa trị (Multivalued), thuộc tính phức hợp hay lặp nhóm.
- **Chứng minh**:
  - `students`: Đã tách `phone` thành 1 SĐT chính duy nhất nguyên tố.
  - `receipts` & `receipt_items`: Đã tách chi tiết các dòng thanh toán đa trị khỏi Header biên lai thành bảng `receipt_items`.
  $\implies$ **Đạt chuẩn 1NF**.

### 2.2. Kiểm tra Dạng Chuẩn 2 (2NF - Second Normal Form)
- **Điều kiện**: Đạt 1NF AND mọi thuộc tính không khóa đều phụ thuộc hàm đầy đủ vào khóa chính (No Partial Functional Dependency).
- **Chứng minh**:
  - Tất cả các bảng `users`, `teachers`, `students`, `classes`, `batches`, `receipts`, `receipt_items` đều sử dụng Khóa chính đơn định danh (`UUID` hoặc `SERIAL`).
  - Do khóa chính là 1 thuộc tính đơn, nên không tồn tại bất kỳ phụ thuộc hàm một phần nào trên khóa chính.
  $\implies$ **Đạt chuẩn 2NF**.

### 2.3. Kiểm tra Dạng Chuẩn 3 (3NF - Third Normal Form)
- **Điều kiện**: Đạt 2NF AND không có thuộc tính không khóa nào phụ thuộc bắc cầu vào khóa chính (No Transitive Functional Dependency).
- **Phân tích Phụ thuộc hàm (Functional Dependencies)**:
  1. Trong `teachers`: `teacher_id` $\to$ `specialization_subject_id`. Tên môn học nằm ở `subjects`, không lưu lặp trong `teachers` $\implies$ Không có phụ thuộc bắc cầu `teacher_id` $\to$ `subject_name`.
  2. Trong `classes`: `class_id` $\to$ `subject_id`, `class_id` $\to$ `teacher_id`. Thông tin chi tiết giáo viên và môn học được phân tách riêng $\implies$ Không có phụ thuộc bắc cầu `class_id` $\to$ `teacher_name`.
  3. Trong `receipt_items`: `item_id` $\to$ `amount_paid`, `class_id`, `batch_id`. Giá học phí gốc nằm ở `batches(fee_rate)` $\implies$ Số tiền đóng thực thu độc lập với học phí đợt.
  $\implies$ **Đạt chuẩn 3NF**.

### 2.4. Kiểm tra Dạng Chuẩn Boyce-Codd (BCNF)
- **Điều kiện**: Với mọi phụ thuộc hàm không hiển nhiên $X \to Y$, $X$ bắt buộc phải là một Siêu khóa (Superkey).
- **Chứng minh**: Trong tất cả các quan hệ trên, vế trái của mọi phụ thuộc hàm không hiển nhiên (ví dụ: `student_code \to full_name, phone`, `receipt_code \to student_id, total_amount`) đều là Khóa ứng viên (Candidate Key / Unique Key).
$\implies$ **Đạt chuẩn BCNF hoàn hảo**.
