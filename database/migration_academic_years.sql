-- =============================================================================
-- EDUMANAGER V2 MIGRATION SCRIPT: ACADEMIC YEARS MANAGEMENT
-- =============================================================================

-- 1. Create academic_years table if not exists
CREATE TABLE IF NOT EXISTS academic_years (
    academic_year_id SERIAL PRIMARY KEY,
    year_name VARCHAR(20) UNIQUE NOT NULL,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed default academic years
INSERT INTO academic_years (year_name, start_date, end_date, is_current)
VALUES 
    ('2024-2025', '2024-09-01', '2025-05-31', FALSE),
    ('2025-2026', '2025-09-01', '2026-05-31', TRUE),
    ('2026-2027', '2026-09-01', '2027-05-31', FALSE)
ON CONFLICT (year_name) DO UPDATE SET is_current = EXCLUDED.is_current;

-- 3. Add academic_year column to classes if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'classes' AND column_name = 'academic_year'
    ) THEN 
        ALTER TABLE classes ADD COLUMN academic_year VARCHAR(20) NOT NULL DEFAULT '2025-2026';
    END IF;
END $$;

-- Add Foreign Key constraint if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_classes_academic_year'
    ) THEN 
        ALTER TABLE classes 
        ADD CONSTRAINT fk_classes_academic_year 
        FOREIGN KEY (academic_year) REFERENCES academic_years(year_name) ON DELETE RESTRICT;
    END IF;
END $$;

-- 4. Enable RLS on academic_years
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow All Public Access" ON academic_years;
CREATE POLICY "Allow All Public Access" ON academic_years FOR ALL USING (true);

-- 5. Recreate View: v_class_details
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

-- 6. Recreate View: v_debt_summary
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

-- 7. Recreate View: v_teacher_batch_payroll
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
