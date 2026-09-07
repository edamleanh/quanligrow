-- =============================================================================
-- EDUMANAGER V2 - SUPABASE PRODUCTION POSTGRESQL DDL SCHEMA
-- Description: Complete 3NF/BCNF Database Schema, Triggers, Views, and RLS Policies
-- Target DBMS: PostgreSQL 15+ (Supabase)
-- Created At: 2026-09-07
-- =============================================================================

-- Enable required PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean up legacy objects safely if re-running (CASCADE handles dependent triggers and views)
DROP VIEW IF EXISTS v_teacher_batch_payroll CASCADE;
DROP VIEW IF EXISTS v_debt_summary CASCADE;
DROP VIEW IF EXISTS v_class_details CASCADE;

DROP TABLE IF EXISTS receipt_items CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS teachers CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP FUNCTION IF EXISTS auto_create_class_batches CASCADE;
DROP FUNCTION IF EXISTS calculate_receipt_total CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;

-- =============================================================================
-- 1. PHYSICAL TABLE DEFINITIONS
-- =============================================================================

-- 1.1 Users Table (System Accounts & Authentication)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMIN', 'CASHIER', 'TEACHER')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Subjects Table (Specialization & Course Categories)
CREATE TABLE subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.3 Teachers Table (Faculty & Instructors)
CREATE TABLE teachers (
    teacher_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) CHECK (phone IS NULL OR phone = '' OR phone ~ '^[0-9]{10,11}$'),
    specialization_subject_id INT REFERENCES subjects(subject_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.4 Students Table (Center Student Directory)
CREATE TABLE students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) CHECK (phone IS NULL OR phone = '' OR phone ~ '^[0-9]{10,11}$'),
    grade INT NOT NULL CHECK (grade BETWEEN 1 AND 12),
    status VARCHAR(20) NOT NULL DEFAULT 'DANG_HOC' CHECK (status IN ('DANG_HOC', 'DA_NGHI', 'DA_TN')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.5 Academic Years Table (Niên Khóa / Năm Học)
CREATE TABLE academic_years (
    academic_year_id SERIAL PRIMARY KEY,
    year_name VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.6 Classes Table (Lớp Học Theo Niên Khóa)
CREATE TABLE classes (
    class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL REFERENCES academic_years(year_name) ON UPDATE CASCADE ON DELETE RESTRICT,
    grade INT NOT NULL CHECK (grade BETWEEN 1 AND 12),
    subject_id INT REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    default_fee_rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (default_fee_rate >= 0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.7 Enrollments Table (Phân Lớp & Ghi Danh Học Sinh)
CREATE TABLE enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WITHDRAWN', 'TRANSFERRED')),
    CONSTRAINT uq_student_class UNIQUE (student_id, class_id)
);

-- 1.8 Batches Table (12 Đợt Học Theo Lớp - Weak Entity)
CREATE TABLE batches (
    batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    batch_number INT NOT NULL CHECK (batch_number BETWEEN 1 AND 12),
    batch_name VARCHAR(100) NOT NULL,
    fee_rate NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (fee_rate >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING' CHECK (status IN ('DANG_HOC', 'UPCOMING', 'COMPLETED')),
    teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_class_batch_number UNIQUE (class_id, batch_number)
);

-- 1.9 Receipts Table (Biên Lai Thu Tiền Header)
CREATE TABLE receipts (
    receipt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_code VARCHAR(50) UNIQUE NOT NULL,
    receipt_type VARCHAR(20) NOT NULL DEFAULT 'IN_MAY' CHECK (receipt_type IN ('IN_MAY', 'NHAP_TAY')),
    manual_receipt_code VARCHAR(50),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    created_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    receipt_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 1.10 Receipt Items Table (Chi Tiết Mục Đóng Biên Lai)
CREATE TABLE receipt_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(receipt_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(batch_id) ON DELETE RESTRICT,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
    item_note TEXT,
    CONSTRAINT uq_receipt_class_batch UNIQUE (receipt_id, class_id, batch_id)
);

-- =============================================================================
-- 2. INDEXES FOR QUERY OPTIMIZATION
-- =============================================================================

CREATE INDEX idx_teachers_phone ON teachers(phone);
CREATE INDEX idx_students_phone ON students(phone);
CREATE INDEX idx_students_grade ON students(grade);
CREATE INDEX idx_classes_academic_year ON classes(academic_year);
CREATE INDEX idx_classes_teacher ON classes(teacher_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_class ON enrollments(class_id);
CREATE INDEX idx_batches_class ON batches(class_id);
CREATE INDEX idx_batches_teacher ON batches(teacher_id);
CREATE INDEX idx_receipts_student ON receipts(student_id);
CREATE INDEX idx_receipts_date ON receipts(receipt_date);
CREATE INDEX idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_batch ON receipt_items(batch_id);

-- =============================================================================
-- 3. STORED FUNCTIONS & TRIGGERS
-- =============================================================================

-- 3.1 Function & Trigger: Automatic updated_at Timestamping
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3.2 Function & Trigger: Automatic Receipt Total Recalculation
CREATE OR REPLACE FUNCTION calculate_receipt_total()
RETURNS TRIGGER AS $$
DECLARE
    target_receipt_id UUID;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_receipt_id := OLD.receipt_id;
    ELSE
        target_receipt_id := NEW.receipt_id;
    END IF;

    UPDATE receipts
    SET total_amount = (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM receipt_items
        WHERE receipt_id = target_receipt_id
    )
    WHERE receipt_id = target_receipt_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipt_items_total_insert AFTER INSERT ON receipt_items FOR EACH ROW EXECUTE FUNCTION calculate_receipt_total();
CREATE TRIGGER trg_receipt_items_total_update AFTER UPDATE ON receipt_items FOR EACH ROW EXECUTE FUNCTION calculate_receipt_total();
CREATE TRIGGER trg_receipt_items_total_delete AFTER DELETE ON receipt_items FOR EACH ROW EXECUTE FUNCTION calculate_receipt_total();

-- 3.3 Function & Trigger: Auto-generate 12 Batches upon Class Creation
CREATE OR REPLACE FUNCTION auto_create_class_batches()
RETURNS TRIGGER AS $$
DECLARE
    i INT;
    b_status VARCHAR(20);
BEGIN
    FOR i IN 1..12 LOOP
        IF i = 1 THEN
            b_status := 'DANG_HOC';
        ELSE
            b_status := 'UPCOMING';
        END IF;

        INSERT INTO batches (
            class_id,
            batch_number,
            batch_name,
            fee_rate,
            status,
            teacher_id
        ) VALUES (
            NEW.class_id,
            i,
            'Đợt ' || i,
            NEW.default_fee_rate,
            b_status,
            NEW.teacher_id
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_classes_after_insert_batches AFTER INSERT ON classes FOR EACH ROW EXECUTE FUNCTION auto_create_class_batches();

-- =============================================================================
-- 4. REPORTING VIEWS
-- =============================================================================

-- 4.1 Class Summary View
CREATE OR REPLACE VIEW v_class_details AS
SELECT 
    c.class_id,
    c.class_name,
    c.academic_year,
    c.grade,
    s.subject_name,
    t.full_name AS teacher_name,
    c.default_fee_rate,
    c.is_active,
    COUNT(DISTINCT e.student_id) FILTER (WHERE e.status = 'ACTIVE') AS student_count
FROM classes c
LEFT JOIN subjects s ON c.subject_id = s.subject_id
LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
LEFT JOIN enrollments e ON c.class_id = e.class_id
GROUP BY c.class_id, c.class_name, c.academic_year, c.grade, s.subject_name, t.full_name, c.default_fee_rate, c.is_active;

-- 4.2 Debt Summary View
CREATE OR REPLACE VIEW v_debt_summary AS
SELECT 
    e.student_id,
    st.student_code,
    st.full_name AS student_name,
    st.phone AS student_phone,
    b.class_id,
    c.class_name,
    b.batch_id,
    b.batch_number,
    b.batch_name,
    b.fee_rate AS expected_amount,
    COALESCE(SUM(ri.amount_paid), 0) AS paid_amount,
    (b.fee_rate - COALESCE(SUM(ri.amount_paid), 0)) AS remaining_debt
FROM enrollments e
JOIN students st ON e.student_id = st.student_id
JOIN classes c ON e.class_id = c.class_id
JOIN batches b ON c.class_id = b.class_id
LEFT JOIN receipts r ON st.student_id = r.student_id
LEFT JOIN receipt_items ri ON r.receipt_id = ri.receipt_id AND ri.batch_id = b.batch_id AND ri.class_id = c.class_id
WHERE e.status = 'ACTIVE' AND b.status = 'DANG_HOC'
GROUP BY e.student_id, st.student_code, st.full_name, st.phone, b.class_id, c.class_name, b.batch_id, b.batch_number, b.batch_name, b.fee_rate;

-- 4.3 Teacher Batch Payroll View
CREATE OR REPLACE VIEW v_teacher_batch_payroll AS
SELECT 
    b.teacher_id,
    t.teacher_code,
    t.full_name AS teacher_name,
    b.class_id,
    c.class_name,
    c.academic_year,
    b.batch_id,
    b.batch_number,
    b.batch_name,
    COUNT(DISTINCT e.student_id) AS enrolled_students,
    COALESCE(SUM(ri.amount_paid), 0) AS total_tuition_collected
FROM batches b
JOIN classes c ON b.class_id = c.class_id
LEFT JOIN teachers t ON b.teacher_id = t.teacher_id
LEFT JOIN enrollments e ON c.class_id = e.class_id AND e.status = 'ACTIVE'
LEFT JOIN receipt_items ri ON b.batch_id = ri.batch_id
GROUP BY b.teacher_id, t.teacher_code, t.full_name, b.class_id, c.class_name, c.academic_year, b.batch_id, b.batch_number, b.batch_name;

-- =============================================================================
-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_items ENABLE ROW LEVEL SECURITY;

-- Default permissive policies for API access
CREATE POLICY "Public read/write access for users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for academic_years" ON academic_years FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for classes" ON classes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for enrollments" ON enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for batches" ON batches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for receipts" ON receipts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public read/write access for receipt_items" ON receipt_items FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 6. PURE DDL SCHEMA COMPLETED (NO SEED DATA)
-- =============================================================================

