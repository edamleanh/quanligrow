-- =============================================================================
-- MIGRATION SCRIPT: Add Class Transfers, Debt Carry-Over & Teacher Batch Assignments
-- =============================================================================

-- 1. Add 'TRANSFERRED' value to enrollment_status ENUM
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'enrollment_status'::regtype AND enumlabel = 'TRANSFERRED'
    ) THEN
        ALTER TYPE enrollment_status ADD VALUE 'TRANSFERRED';
    END IF;
END $$;

-- 2. Add teacher_id column to batches table if not exists
ALTER TABLE batches ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES teachers(teacher_id) ON DELETE RESTRICT;

-- 3. Create CLASS_TRANSFERS table
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

-- 4. Create CLASS_TEACHER_ASSIGNMENTS table
CREATE TABLE IF NOT EXISTS class_teacher_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    batch_id UUID NOT NULL REFERENCES batches(batch_id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(teacher_id) ON DELETE RESTRICT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    note TEXT,
    CONSTRAINT unique_batch_teacher UNIQUE (batch_id)
);

-- 5. Update v_debt_summary View to include both ACTIVE and TRANSFERRED classes
CREATE OR REPLACE VIEW v_debt_summary AS
SELECT 
    b.batch_id,
    b.batch_name,
    b.batch_number,
    c.class_id,
    c.class_name,
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
GROUP BY b.batch_id, b.batch_name, b.batch_number, c.class_id, c.class_name, st.student_id, st.student_code, st.full_name, st.phone, b.fee_rate, e.status;

-- 6. Create v_teacher_batch_payroll View for Teacher Payroll per Batch
CREATE OR REPLACE VIEW v_teacher_batch_payroll AS
SELECT 
    t.teacher_id,
    t.teacher_code,
    t.full_name AS teacher_name,
    c.class_id,
    c.class_name,
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
GROUP BY t.teacher_id, t.teacher_code, t.full_name, c.class_id, c.class_name, b.batch_id, b.batch_number, b.batch_name, b.fee_rate, b.status;

-- 7. Enable RLS and Policies
ALTER TABLE class_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_teacher_assignments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow All Public Access' AND tablename = 'class_transfers') THEN
        CREATE POLICY "Allow All Public Access" ON class_transfers FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow All Public Access' AND tablename = 'class_teacher_assignments') THEN
        CREATE POLICY "Allow All Public Access" ON class_teacher_assignments FOR ALL USING (true);
    END IF;
END $$;
