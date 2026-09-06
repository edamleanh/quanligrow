-- =============================================================================
-- MIGRATION SCRIPT: Transform `ds_tong` flat table to 3NF Relational Schema
-- =============================================================================

-- 1. Insert Default Subjects
INSERT INTO subjects (subject_code, subject_name) VALUES
('TOAN', 'Toán'),
('LY', 'Lý'),
('HOA', 'Hóa'),
('VAN', 'Văn'),
('AV', 'Anh Văn'),
('GVNN', 'GVNN')
ON CONFLICT (subject_code) DO NOTHING;

-- 2. Migrate Students from `ds_tong`
INSERT INTO students (student_code, full_name, phone, grade, status, notes)
SELECT 
    CASE 
        WHEN STT IS NULL OR STT = '' THEN 'HS' || LPAD(ROW_NUMBER() OVER (ORDER BY id)::text, 4, '0')
        ELSE 'HS' || LPAD(STT::text, 4, '0')
    END AS student_code,
    TRIM(COALESCE("HỌ", '') || ' ' || COALESCE("TÊN", '')) AS full_name,
    CASE 
        WHEN "SỐ ĐT" IS NULL OR "SỐ ĐT" = '' THEN '0900000000'
        ELSE REGEXP_REPLACE("SỐ ĐT", '[^0-9]', '', 'g')
    END AS phone,
    CASE 
        WHEN "LỚP" ~ '^[0-9]+$' THEN "LỚP"::INT
        ELSE 6
    END AS grade,
    'DANG_HOC'::student_status AS status,
    "Ghi chú" AS notes
FROM ds_tong
WHERE STT != 99999 
  AND TRIM(COALESCE("HỌ", '') || ' ' || COALESCE("TÊN", '')) != ''
ON CONFLICT (student_code) DO NOTHING;

-- 3. Auto-generate Classes from Distinct Subject Columns in `ds_tong`
-- Class naming convention: "Lớp {LỚP} - {MÔN}"

-- 3.1 Toán
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || "TOÁN" || ' - Toán' AS class_name,
    "LỚP"::INT AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'TOAN'),
    800000.00
FROM ds_tong
WHERE "TOÁN" IS NOT NULL AND TRIM("TOÁN") != '' AND "LỚP" ~ '^[0-9]+$'
ON CONFLICT DO NOTHING;

-- 3.2 Văn
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || "VĂN" || ' - Văn' AS class_name,
    "LỚP"::INT AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'VAN'),
    700000.00
FROM ds_tong
WHERE "VĂN" IS NOT NULL AND TRIM("VĂN") != '' AND "LỚP" ~ '^[0-9]+$'
ON CONFLICT DO NOTHING;

-- 3.3 Anh Văn
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || "AV" || ' - Anh Văn' AS class_name,
    "LỚP"::INT AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'AV'),
    750000.00
FROM ds_tong
WHERE "AV" IS NOT NULL AND TRIM("AV") != '' AND "LỚP" ~ '^[0-9]+$'
ON CONFLICT DO NOTHING;

-- 3.4 Hóa
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || "Hóa" || ' - Hóa' AS class_name,
    "LỚP"::INT AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'HOA'),
    800000.00
FROM ds_tong
WHERE "Hóa" IS NOT NULL AND TRIM("Hóa") != '' AND "LỚP" ~ '^[0-9]+$'
ON CONFLICT DO NOTHING;

-- 3.5 Lý
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || "Lý" || ' - Lý' AS class_name,
    "LỚP"::INT AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'LY'),
    800000.00
FROM ds_tong
WHERE "Lý" IS NOT NULL AND TRIM("Lý") != '' AND "LỚP" ~ '^[0-9]+$'
ON CONFLICT DO NOTHING;
