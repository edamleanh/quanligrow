# TÀI LIỆU MÔ HÌNH DỮ LIỆU QUAN HỆ & CHỨNG MINH DẠNG CHUẨN (RELATIONAL DATA MODEL & 3NF/BCNF PROOF)
## DỰ ÁN: HỆ THỐNG QUẢN LÝ TRUNG TÂM DẠY THÊM (EDUMANAGER V2)

---

## 1. MÔ HÌNH QUAN HỆ DẠNG KÝ HIỆU LÝ THUYẾT (RELATIONAL DATA MODEL FORMAL NOTATION)

Áp dụng quy tắc ký hiệu chuẩn học thuật: Tên quan hệ, thuộc tính khóa chính được gạch chân `<u>PK</u>`, thuộc tính khóa ngoại ký hiệu `FK -> ParentTable(PK)`.

1. **`users`** (Người dùng hệ thống):
   - `users(<u>user_id</u>, username, password_hash, full_name, role, created_at, updated_at)`

2. **`subjects`** (Danh mục Môn học):
   - `subjects(<u>subject_id</u>, subject_code, subject_name, created_at)`

3. **`teachers`** (Danh mục Giáo viên):
   - `teachers(<u>teacher_id</u>, teacher_code, full_name, phone, specialization_subject_id -> subjects(subject_id), created_at, updated_at)`

4. **`students`** (Danh mục Học sinh):
   - `students(<u>student_id</u>, student_code, full_name, phone, grade, status, notes, created_at, updated_at)`

5. **`academic_years`** (Danh mục Năm học / Niên khóa):
   - `academic_years(<u>academic_year_id</u>, year_name, start_date, end_date, is_current, created_at)`

6. **`classes`** (Danh mục Lớp học theo Niên khóa):
   - `classes(<u>class_id</u>, class_name, academic_year -> academic_years(year_name), grade, subject_id -> subjects(subject_id), teacher_id -> teachers(teacher_id), default_fee_rate, is_active, created_at, updated_at)`

7. **`enrollments`** (Ghi danh Học sinh vào Lớp học):
   - `enrollments(<u>enrollment_id</u>, student_id -> students(student_id), class_id -> classes(class_id), enrolled_at, status, start_batch_number, end_batch_number)`

8. **`batches`** (12 Đợt học theo Lớp - Weak Entity Relation):
   - `batches(<u>batch_id</u>, class_id -> classes(class_id), batch_number, batch_name, fee_rate, status, teacher_id -> teachers(teacher_id), created_at, updated_at)`

9. **`receipts`** (Biên lai Thu tiền Header):
   - `receipts(<u>receipt_id</u>, receipt_code, receipt_type, manual_receipt_code, student_id -> students(student_id), created_by_user_id -> users(user_id), total_amount, receipt_date, created_at)`

10. **`receipt_items`** (Chi tiết Mục đóng Biên lai Line Items):
    - `receipt_items(<u>item_id</u>, receipt_id -> receipts(receipt_id), class_id -> classes(class_id), batch_id -> batches(batch_id), amount_paid, item_note)`

---

## 2. CHỨNG MINH ÁP DỤNG 7 QUY TẮC CHUYỂN ĐỔI TỪ ERD SANG MÔ HÌNH QUAN HỆ

Theo lý thuyết chuyển đổi chuẩn Elmasri & Navathe:

- **Rule 1 (Strong Entities)**: Tạo các quan hệ độc lập cho `USERS`, `SUBJECTS`, `TEACHERS`, `STUDENTS`, `ACADEMIC_YEARS`, `CLASSES`, `RECEIPTS` với Khóa chính đơn định danh duy nhất (`UUID` hoặc `SERIAL`).
- **Rule 2 (Weak Entities)**: Quan hệ `BATCHES` và `RECEIPT_ITEMS` kế thừa Khóa chính của Bảng chủ (`classes` và `receipts`) làm Khóa ngoại `FK` và kết hợp thuộc tính định danh để đảm bảo toàn vẹn.
- **Rule 3 (Binary 1:1 Relationships)**: Không có mối quan hệ 1:1 thuần túy (Mỗi người dùng có 1 vai trò duy nhất được lưu dạng thuộc tính Enum `role`).
- **Rule 4 (Binary 1:N Relationships)**: 
  - Thêm `academic_year` (FK), `subject_id` (FK), `teacher_id` (FK) vào quan hệ `classes`.
  - Thêm `specialization_subject_id` (FK) vào quan hệ `teachers`.
  - Thêm `student_id` (FK), `created_by_user_id` (FK) vào quan hệ `receipts`.
- **Rule 5 (Binary N:M Relationships)**:
  - Mối quan hệ Nhiều - Nhiều giữa `STUDENTS` và `CLASSES` được chuyển đổi thành bảng thực thể trung gian `ENROLLMENTS` với hai khóa ngoại `student_id` và `class_id`.
- **Rule 6 (Multivalued Attributes)**:
  - Loại bỏ các thuộc tính đa trị bằng cách tạo bảng liên kết chi tiết `RECEIPT_ITEMS` cho các dòng đóng tiền đa trị của Biên lai.
- **Rule 7 (N-ary Relationships)**:
  - Quan hệ 3 ngôi giữa `RECEIPTS`, `CLASSES`, và `BATCHES` được chuyển đổi thành quan hệ liên kết `RECEIPT_ITEMS`.

---

## 3. LÝ THUYẾT VÀ CHỨNG MINH DẠNG CHUẨN (NORMALIZATION PROOF)

### 3.1. Phân Tích Phụ Thuộc Hàm (Functional Dependencies - FDs)

1. Quan hệ **`students`**:
   - $FD_1: \text{student\_id} \to \{\text{student\_code}, \text{full\_name}, \text{phone}, \text{grade}, \text{status}, \text{notes}\}$
   - $FD_2: \text{student\_code} \to \{\text{student\_id}, \text{full\_name}, \text{phone}, \text{grade}, \text{status}, \text{notes}\}$
   - Siêu khóa (Superkeys): `student_id`, `student_code`.

2. Quan hệ **`classes`**:
   - $FD_1: \text{class\_id} \to \{\text{class\_name}, \text{academic\_year}, \text{grade}, \text{subject\_id}, \text{teacher\_id}, \text{default\_fee\_rate}, \text{is\_active}\}$
   - Siêu khóa: `class_id`.

3. Quan hệ **`batches`**:
   - $FD_1: \text{batch\_id} \to \{\text{class\_id}, \text{batch\_number}, \text{batch\_name}, \text{fee\_rate}, \text{status}, \text{teacher\_id}\}$
   - $FD_2: \{\text{class\_id}, \text{batch\_number}\} \to \{\text{batch\_id}, \text{batch\_name}, \text{fee\_rate}, \text{status}, \text{teacher\_id}\}$
   - Siêu khóa: `batch_id`, `(class_id, batch_number)`.

4. Quan hệ **`receipts`**:
   - $FD_1: \text{receipt\_id} \to \{\text{receipt\_code}, \text{receipt\_type}, \text{manual\_receipt_code}, \text{student\_id}, \text{created\_by\_user\_id}, \text{total\_amount}, \text{receipt\_date}\}$
   - $FD_2: \text{receipt\_code} \to \{\text{receipt\_id}, \text{receipt\_type}, \text{manual\_receipt_code}, \text{student\_id}, \text{created\_by\_user\_id}, \text{total\_amount}, \text{receipt\_date}\}$
   - Siêu khóa: `receipt_id`, `receipt_code`.

5. Quan hệ **`receipt_items`**:
   - $FD_1: \text{item\_id} \to \{\text{receipt\_id}, \text{class\_id}, \text{batch\_id}, \text{amount\_paid}, \text{item\_note}\}$
   - $FD_2: \{\text{receipt\_id}, \text{class\_id}, \text{batch\_id}\} \to \{\text{item\_id}, \text{amount\_paid}, \text{item\_note}\}$
   - Siêu khóa: `item_id`, `(receipt_id, class_id, batch_id)`.

---

### 3.2. Chứng Minh Đạt Dạng Chuẩn 1 (1NF Proof)
- **Điều kiện**: Tất cả các thuộc tính trong mọi quan hệ đều chứa giá trị nguyên tố (Atomic values).
- **Chứng minh**:
  - Không tồn tại thuộc tính phức hợp (Composite Attributes) hay thuộc tính đa trị (Multivalued Attributes) trong cùng một ô dữ liệu.
  - Chi tiết đóng tiền đa trị của biên lai đã được tách riêng sang bảng `receipt_items`.
  - $\to$ Tất cả các bảng đạt **1NF**.

### 3.3. Chứng Minh Đạt Dạng Chuẩn 2 (2NF Proof)
- **Điều kiện**: Đạt 1NF AND mọi thuộc tính không khóa đều phụ thuộc hàm đầy đủ vào khóa chính (No Partial Dependency).
- **Chứng minh**:
  - Đối với các bảng có khóa chính đơn (`student_id`, `teacher_id`, `class_id`, `receipt_id`, `user_id`), không thể xảy ra phụ thuộc một phần.
  - Đối với các bảng có khóa phức hợp/unique constraint (`enrollments`, `batches`, `receipt_items`), các thuộc tính không khóa (như `enrolled_at`, `fee_rate`, `amount_paid`) chỉ có ý nghĩa khi xác định đầy đủ cả tập hợp khóa chính.
  - $\to$ Tất cả các bảng đạt **2NF**.

### 3.4. Chứng Minh Đạt Dạng Chuẩn 3 (3NF Proof)
- **Điều kiện**: Đạt 2NF AND không có thuộc tính không khóa nào phụ thuộc bắc cầu vào khóa chính (No Transitive Dependency).
- **Chứng minh**:
  - Trong bảng `classes`, các thuộc tính `subject_id` và `teacher_id` là các khóa ngoại trỏ sang bảng tham chiếu độc lập `subjects` và `teachers`, thông tin tên môn hay tên giáo viên không được lưu lặp lại trong `classes`.
  - Trong bảng `receipts`, tổng tiền `total_amount` được tính toán tự động qua Trigger tính tổng từ `receipt_items`, không gây ra phụ thuộc bắc cầu dữ liệu dư thừa.
  - Với mọi phụ thuộc hàm $X \to Y$, $X$ luôn là một Siêu khóa hoặc $Y$ là thuộc tính khóa.
  - $\to$ Tất cả các bảng đạt **3NF**.

### 3.5. Chứng Minh Đạt Dạng Chuẩn Boyce-Codd (BCNF Proof)
- **Điều kiện**: Với mọi phụ thuộc hàm không hiển nhiên $X \to Y$, $X$ bắt buộc phải là một **Siêu khóa (Superkey)**.
- **Chứng minh**:
  - Xét phụ thuộc hàm $FD_1: \text{student\_code} \to \dots$ trong `students`, vì `student_code` có ràng buộc `UNIQUE` nên `student_code` là một Siêu khóa hợp lệ.
  - Xét phụ thuộc hàm $FD_2: \text{receipt\_code} \to \dots$ trong `receipts`, `receipt_code` là Siêu khóa hợp lệ.
  - Xét phụ thuộc hàm $FD_2: \{\text{class\_id}, \text{batch\_number}\} \to \dots$ trong `batches`, vế trái có ràng buộc `UNIQUE` nên là Siêu khóa.
  - $\to$ Tất cả các vế trái của mọi phụ thuộc hàm phi hiển nhiên đều là Siêu khóa $\to$ Tất cả các quan hệ đều đạt **BCNF**.

---

## 4. TỔNG HỢP CÁC CHỈ MỤC & RÀNG BUỘC TOÀN VẸN (INDEXES & CONSTRAINTS)

### 4.1. Khóa Chính & Khóa Ngoại (PK & FK Constraints)
- `users`: `PRIMARY KEY (user_id)`
- `subjects`: `PRIMARY KEY (subject_id)`
- `teachers`: `PRIMARY KEY (teacher_id)`, `FOREIGN KEY (specialization_subject_id) REFERENCES subjects(subject_id)`
- `students`: `PRIMARY KEY (student_id)`
- `academic_years`: `PRIMARY KEY (academic_year_id)`
- `classes`: `PRIMARY KEY (class_id)`, `FOREIGN KEY (academic_year) REFERENCES academic_years(year_name)`, `FOREIGN KEY (subject_id) REFERENCES subjects(subject_id)`, `FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)`
- `enrollments`: `PRIMARY KEY (enrollment_id)`, `FOREIGN KEY (student_id) REFERENCES students(student_id)`, `FOREIGN KEY (class_id) REFERENCES classes(class_id)`
- `batches`: `PRIMARY KEY (batch_id)`, `FOREIGN KEY (class_id) REFERENCES classes(class_id)`
- `receipts`: `PRIMARY KEY (receipt_id)`, `FOREIGN KEY (student_id) REFERENCES students(student_id)`, `FOREIGN KEY (created_by_user_id) REFERENCES users(user_id)`
- `receipt_items`: `PRIMARY KEY (item_id)`, `FOREIGN KEY (receipt_id) REFERENCES receipts(receipt_id)`, `FOREIGN KEY (class_id) REFERENCES classes(class_id)`, `FOREIGN KEY (batch_id) REFERENCES batches(batch_id)`

### 4.2. Ràng Buộc Kiểm Tra (CHECK Constraints)
- `students`: `CHECK (phone ~ '^[0-9]{10,11}$')`, `CHECK (grade BETWEEN 1 AND 12)`, `CHECK (status IN ('DANG_HOC', 'DA_NGHI', 'DA_TN'))`
- `teachers`: `CHECK (phone IS NULL OR phone = '' OR phone ~ '^[0-9]{10,11}$')`
- `classes`: `CHECK (grade BETWEEN 1 AND 12)`, `CHECK (default_fee_rate >= 0)`
- `batches`: `CHECK (batch_number BETWEEN 1 AND 12)`, `CHECK (fee_rate >= 0)`, `CHECK (status IN ('DANG_HOC', 'UPCOMING', 'COMPLETED'))`
- `receipts`: `CHECK (total_amount >= 0)`, `CHECK (receipt_type IN ('IN_MAY', 'NHAP_TAY'))`
- `receipt_items`: `CHECK (amount_paid >= 0)`

### 4.3. Chỉ Mục Tối Ưu Truy Vấn (Performance Indexes)
- `CREATE INDEX idx_students_phone ON students(phone);`
- `CREATE INDEX idx_classes_academic_year ON classes(academic_year);`
- `CREATE INDEX idx_enrollments_student ON enrollments(student_id);`
- `CREATE INDEX idx_enrollments_class ON enrollments(class_id);`
- `CREATE INDEX idx_batches_class ON batches(class_id);`
- `CREATE INDEX idx_receipts_student ON receipts(student_id);`
- `CREATE INDEX idx_receipt_items_receipt ON receipt_items(receipt_id);`
