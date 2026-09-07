-- =============================================================================
-- EDUMANAGER V2 PRODUCTION DATABASE SCHEMA (PostgreSQL / Supabase)
-- Standardized 3NF / BCNF Schema with Constraints, Triggers, Views & RLS
-- =============================================================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- -----------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('ADMIN', 'CASHIER', 'TEACHER');
CREATE TYPE student_status AS ENUM ('DANG_HOC', 'DA_NGHI', 'DA_TN');
CREATE TYPE enrollment_status AS ENUM ('ACTIVE', 'WITHDRAWN', 'TRANSFERRED');
CREATE TYPE receipt_type_enum AS ENUM ('IN_MAY', 'NHAP_TAY');
CREATE TYPE batch_status AS ENUM ('DANG_HOC', 'UPCOMING', 'COMPLETED');

-- -----------------------------------------------------------------------------
-- 2. TABLES DEFINITION
-- -----------------------------------------------------------------------------

-- 2.1 USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'CASHIER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.2 SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    subject_id SERIAL PRIMARY KEY,
    subject_code VARCHAR(20) UNIQUE NOT NULL,
    subject_name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.3 TEACHERS TABLE
CREATE TABLE IF NOT EXISTS teachers (
    teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL CONSTRAINT check_teacher_phone CHECK (phone ~ '^[0-9]{10,11}$'),
    specialization_subject_id INT REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.4 STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_code VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(15) NOT NULL CONSTRAINT check_student_phone CHECK (phone ~ '^[0-9]{10,11}$'),
    grade INT NOT NULL CONSTRAINT check_student_grade CHECK (grade BETWEEN 1 AND 12),
    status student_status NOT NULL DEFAULT 'DANG_HOC',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.5 ACADEMIC YEARS TABLE
CREATE TABLE IF NOT EXISTS academic_years (
    academic_year_id SERIAL PRIMARY KEY,
    year_name VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 CLASSES TABLE
CREATE TABLE IF NOT EXISTS classes (
    class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(100) NOT NULL,
    academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026' REFERENCES academic_years(year_name) ON DELETE RESTRICT,
    grade INT NOT NULL CONSTRAINT check_class_grade CHECK (grade BETWEEN 1 AND 12),
    subject_id INT NOT NULL REFERENCES subjects(subject_id) ON DELETE RESTRICT,
    teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE RESTRICT,
    default_fee_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CONSTRAINT check_fee_rate CHECK (default_fee_rate >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.6 ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status enrollment_status NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT unique_student_class UNIQUE (student_id, class_id)
);

-- 2.7 BATCHES TABLE
CREATE TABLE IF NOT EXISTS batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    batch_number INT NOT NULL CONSTRAINT check_batch_number CHECK (batch_number BETWEEN 1 AND 12),
    batch_name VARCHAR(100) NOT NULL,
    fee_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CONSTRAINT check_batch_fee CHECK (fee_rate >= 0),
    status batch_status NOT NULL DEFAULT 'UPCOMING',
    teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_batch_number UNIQUE (class_id, batch_number)
);

-- 2.8 RECEIPTS TABLE (Header)
CREATE TABLE IF NOT EXISTS receipts (
    receipt_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_code VARCHAR(30) UNIQUE NOT NULL,
    receipt_type receipt_type_enum NOT NULL DEFAULT 'IN_MAY',
    manual_receipt_code VARCHAR(50),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE RESTRICT,
    created_by_user_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CONSTRAINT check_total_amount CHECK (total_amount >= 0),
    receipt_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.9 RECEIPT_ITEMS TABLE (Line Items)
CREATE TABLE IF NOT EXISTS receipt_items (
    item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    receipt_id UUID NOT NULL REFERENCES receipts(receipt_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
    batch_id UUID NOT NULL REFERENCES batches(batch_id) ON DELETE RESTRICT,
    amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CONSTRAINT check_amount_paid CHECK (amount_paid >= 0),
    item_note TEXT,
    CONSTRAINT unique_receipt_class_batch UNIQUE (receipt_id, class_id, batch_id)
);

-- 2.10 CLASS_TRANSFERS TABLE (Student Transfer Audit & History)
CREATE TABLE IF NOT EXISTS class_transfers (
    transfer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    from_class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
    to_class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE RESTRICT,
    transfer_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    effective_batch_number INT NOT NULL CONSTRAINT check_transfer_batch CHECK (effective_batch_number BETWEEN 1 AND 12),
    reason TEXT,
    created_by_user_id UUID REFERENCES users(user_id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2.11 CLASS_TEACHER_ASSIGNMENTS TABLE (Teacher Assignment History per Batch)
CREATE TABLE IF NOT EXISTS class_teacher_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(teacher_id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    CONSTRAINT unique_batch_teacher UNIQUE (batch_id)
);

-- -----------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_batches_class ON batches(class_id);
CREATE INDEX IF NOT EXISTS idx_receipts_student ON receipts(student_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_receipt ON receipt_items(receipt_id);
CREATE INDEX IF NOT EXISTS idx_receipt_items_class_batch ON receipt_items(class_id, batch_id);

-- -----------------------------------------------------------------------------
-- 4. DATABASE TRIGGERS & STORED FUNCTIONS
-- -----------------------------------------------------------------------------

-- 4.1 Auto Update Timestamp Trigger Function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_teachers_updated BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER trg_batches_updated BEFORE UPDATE ON batches FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- 4.2 Auto Calculate Receipt Total Amount Trigger
CREATE OR REPLACE FUNCTION trigger_update_receipt_total()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE receipts
    SET total_amount = (
        SELECT COALESCE(SUM(amount_paid), 0)
        FROM receipt_items
        WHERE receipt_id = COALESCE(NEW.receipt_id, OLD.receipt_id)
    )
    WHERE receipt_id = COALESCE(NEW.receipt_id, OLD.receipt_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_receipt_items_total AFTER INSERT OR UPDATE OR DELETE ON receipt_items
FOR EACH ROW EXECUTE FUNCTION trigger_update_receipt_total();

-- 4.3 Auto Generate 12 Batches per Class Trigger
CREATE OR REPLACE FUNCTION trigger_auto_create_12_batches()
RETURNS TRIGGER AS $$
DECLARE
    i INT;
BEGIN
    FOR i IN 1..12 LOOP
        INSERT INTO batches (class_id, batch_number, batch_name, fee_rate, status)
        VALUES (
            NEW.class_id,
            i,
            'Đợt ' || i,
            NEW.default_fee_rate,
            CASE WHEN i = 1 THEN 'DANG_HOC'::batch_status ELSE 'UPCOMING'::batch_status END
        )
        ON CONFLICT (class_id, batch_number) DO NOTHING;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_classes_after_insert_create_batches
AFTER INSERT ON classes
FOR EACH ROW EXECUTE FUNCTION trigger_auto_create_12_batches();

-- -----------------------------------------------------------------------------
-- 5. REPORTING & DEBT VIEWS
-- -----------------------------------------------------------------------------

-- 5.1 View: Full Class Overview with Teacher & Subject
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
    COUNT(e.student_id) AS enrolled_count
FROM classes c
JOIN subjects s ON c.subject_id = s.subject_id
LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
LEFT JOIN enrollments e ON c.class_id = e.class_id AND e.status = 'ACTIVE'
GROUP BY c.class_id, c.academic_year, s.subject_name, t.full_name;

-- 5.2 View: Student Debt & Payment Status per Class & Batch (Supports Active & Transferred Classes)
CREATE OR REPLACE VIEW v_debt_summary AS
SELECT 
    b.batch_id,
    b.batch_name,
    b.batch_number,
    c.class_id,
    c.class_name,
    c.academic_year,
    st.student_id,
    st.student_code,
    st.full_name AS student_name,
    st.phone AS student_phone,
    b.fee_rate AS required_fee,
    COALESCE(SUM(ri.amount_paid), 0) AS total_paid,
    CASE 
        WHEN COALESCE(SUM(ri.amount_paid), 0) >= b.fee_rate THEN 'PAID'
        WHEN COALESCE(SUM(ri.amount_paid), 0) > 0 THEN 'PARTIAL'
        ELSE 'UNPAID'
    END AS payment_status,
    e.status AS enrollment_status
FROM enrollments e
JOIN students st ON e.student_id = st.student_id
JOIN classes c ON e.class_id = c.class_id
JOIN batches b ON b.class_id = c.class_id
LEFT JOIN receipts r ON r.student_id = st.student_id
LEFT JOIN receipt_items ri ON ri.receipt_id = r.receipt_id AND ri.class_id = c.class_id AND ri.batch_id = b.batch_id
WHERE e.status IN ('ACTIVE', 'TRANSFERRED')
GROUP BY b.batch_id, b.batch_name, b.batch_number, c.class_id, c.class_name, c.academic_year, st.student_id, st.student_code, st.full_name, st.phone, b.fee_rate, e.status;

-- 5.3 View: Teacher Batch Payroll & Revenue Summary per Batch
CREATE OR REPLACE VIEW v_teacher_batch_payroll AS
SELECT 
    t.teacher_id,
    t.teacher_code,
    t.full_name AS teacher_name,
    c.class_id,
    c.class_name,
    c.academic_year,
    b.batch_id,
    b.batch_number,
    b.batch_name,
    b.fee_rate AS batch_fee_rate,
    b.status AS batch_status,
    COALESCE(SUM(ri.amount_paid), 0) AS total_revenue_collected,
    COUNT(DISTINCT ri.receipt_id) AS total_receipts_count
FROM batches b
JOIN classes c ON b.class_id = c.class_id
LEFT JOIN teachers t ON COALESCE(b.teacher_id, c.teacher_id) = t.teacher_id
LEFT JOIN receipt_items ri ON ri.batch_id = b.batch_id
GROUP BY t.teacher_id, t.teacher_code, t.full_name, c.class_id, c.class_name, c.academic_year, b.batch_id, b.batch_number, b.batch_name, b.fee_rate, b.status;

-- -----------------------------------------------------------------------------
-- 6. SUPABASE ROW LEVEL SECURITY (RLS POLICIES)
-- -----------------------------------------------------------------------------
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
ALTER TABLE class_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teacher_assignments ENABLE ROW LEVEL SECURITY;

-- Allow public / anon full CRUD for active integration
CREATE POLICY "Allow All Public Access" ON users FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON students FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON academic_years FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON classes FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON enrollments FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON batches FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON receipts FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON receipt_items FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON class_transfers FOR ALL USING (true);
CREATE POLICY "Allow All Public Access" ON class_teacher_assignments FOR ALL USING (true);
