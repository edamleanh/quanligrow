-- =============================================================================
-- MIGRATION SCRIPT (FIXED): Transform `ds_tong` flat table to 3NF Relational Schema
-- Properly handles PostgreSQL case-sensitive double quotes for "STT", "HỌ", "TÊN", etc.
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
    'HS' || LPAD(ROW_NUMBER() OVER (ORDER BY "id")::text, 5, '0') AS student_code,
    TRIM(COALESCE("HỌ", '') || ' ' || COALESCE("TÊN", '')) AS full_name,
    CASE 
        WHEN LENGTH(REGEXP_REPLACE(COALESCE("SỐ ĐT", ''), '[^0-9]', '', 'g')) BETWEEN 10 AND 11 
            THEN REGEXP_REPLACE("SỐ ĐT", '[^0-9]', '', 'g')
        ELSE '090' || LPAD(ROW_NUMBER() OVER (ORDER BY "id")::text, 7, '0')
    END AS phone,
    CASE 
        WHEN "LỚP" LIKE '%12N%' OR "LỚP" LIKE '%TN%' THEN 12
        WHEN "LỚP" ~ '^[0-9]+$' AND "LỚP"::INT BETWEEN 1 AND 12 THEN "LỚP"::INT
        ELSE 6
    END AS grade,
    CASE 
        WHEN "LỚP" LIKE '%12N%' OR "LỚP" LIKE '%TN%' OR "Ghi chú" LIKE '%TN%' OR "Ghi chú" LIKE '%TỐT NGHIỆP%' THEN 'DA_TN'::student_status
        ELSE 'DANG_HOC'::student_status
    END AS status,
    "Ghi chú" AS notes
FROM ds_tong
WHERE ("STT"::text != '99999' OR "STT" IS NULL)
  AND TRIM(COALESCE("HỌ", '') || ' ' || COALESCE("TÊN", '')) != ''
ON CONFLICT (student_code) DO NOTHING;

-- 3. Auto-generate Classes from Distinct Subject Columns in `ds_tong`

-- 3.1 Toán
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || TRIM("TOÁN") || ' - Toán' AS class_name,
    CASE WHEN "LỚP" ~ '^[0-9]+$' AND "LỚP"::INT BETWEEN 1 AND 12 THEN "LỚP"::INT ELSE 6 END AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'TOAN'),
    350000.00
FROM ds_tong
WHERE "TOÁN" IS NOT NULL AND TRIM("TOÁN") != ''
ON CONFLICT DO NOTHING;

-- 3.2 Văn
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || TRIM("VĂN") || ' - Văn' AS class_name,
    CASE WHEN "LỚP" ~ '^[0-9]+$' AND "LỚP"::INT BETWEEN 1 AND 12 THEN "LỚP"::INT ELSE 6 END AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'VAN'),
    300000.00
FROM ds_tong
WHERE "VĂN" IS NOT NULL AND TRIM("VĂN") != ''
ON CONFLICT DO NOTHING;

-- 3.3 Anh Văn
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || TRIM("AV") || ' - Anh Văn' AS class_name,
    CASE WHEN "LỚP" ~ '^[0-9]+$' AND "LỚP"::INT BETWEEN 1 AND 12 THEN "LỚP"::INT ELSE 6 END AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'AV'),
    350000.00
FROM ds_tong
WHERE "AV" IS NOT NULL AND TRIM("AV") != ''
ON CONFLICT DO NOTHING;

-- 3.4 Hóa
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || TRIM("Hóa") || ' - Hóa' AS class_name,
    CASE WHEN "LỚP" ~ '^[0-9]+$' AND "LỚP"::INT BETWEEN 1 AND 12 THEN "LỚP"::INT ELSE 6 END AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'HOA'),
    350000.00
FROM ds_tong
WHERE "Hóa" IS NOT NULL AND TRIM("Hóa") != ''
ON CONFLICT DO NOTHING;

-- 3.5 Lý
INSERT INTO classes (class_name, grade, subject_id, default_fee_rate)
SELECT DISTINCT 
    'Lớp ' || "LỚP" || TRIM("Lý") || ' - Lý' AS class_name,
    CASE WHEN "LỚP" ~ '^[0-9]+$' AND "LỚP"::INT BETWEEN 1 AND 12 THEN "LỚP"::INT ELSE 6 END AS grade,
    (SELECT subject_id FROM subjects WHERE subject_code = 'LY'),
    350000.00
FROM ds_tong
WHERE "Lý" IS NOT NULL AND TRIM("Lý") != ''
ON CONFLICT DO NOTHING;

-- 4. Auto Enroll Students Into Created Classes
-- 4.1 Enroll Toán
INSERT INTO enrollments (student_id, class_id)
SELECT DISTINCT 
    s.student_id,
    c.class_id
FROM ds_tong d
JOIN students s ON s.full_name = TRIM(COALESCE(d."HỌ", '') || ' ' || COALESCE(d."TÊN", ''))
JOIN classes c ON c.class_name = 'Lớp ' || d."LỚP" || TRIM(d."TOÁN") || ' - Toán'
WHERE d."TOÁN" IS NOT NULL AND TRIM(d."TOÁN") != ''
ON CONFLICT DO NOTHING;

-- 4.2 Enroll Văn
INSERT INTO enrollments (student_id, class_id)
SELECT DISTINCT 
    s.student_id,
    c.class_id
FROM ds_tong d
JOIN students s ON s.full_name = TRIM(COALESCE(d."HỌ", '') || ' ' || COALESCE(d."TÊN", ''))
JOIN classes c ON c.class_name = 'Lớp ' || d."LỚP" || TRIM(d."VĂN") || ' - Văn'
WHERE d."VĂN" IS NOT NULL AND TRIM(d."VĂN") != ''
ON CONFLICT DO NOTHING;

-- 4.3 Enroll Anh Văn
INSERT INTO enrollments (student_id, class_id)
SELECT DISTINCT 
    s.student_id,
    c.class_id
FROM ds_tong d
JOIN students s ON s.full_name = TRIM(COALESCE(d."HỌ", '') || ' ' || COALESCE(d."TÊN", ''))
JOIN classes c ON c.class_name = 'Lớp ' || d."LỚP" || TRIM(d."AV") || ' - Anh Văn'
WHERE d."AV" IS NOT NULL AND TRIM(d."AV") != ''
ON CONFLICT DO NOTHING;

-- 4.4 Enroll Hóa
INSERT INTO enrollments (student_id, class_id)
SELECT DISTINCT 
    s.student_id,
    c.class_id
FROM ds_tong d
JOIN students s ON s.full_name = TRIM(COALESCE(d."HỌ", '') || ' ' || COALESCE(d."TÊN", ''))
JOIN classes c ON c.class_name = 'Lớp ' || d."LỚP" || TRIM(d."Hóa") || ' - Hóa'
WHERE d."Hóa" IS NOT NULL AND TRIM(d."Hóa") != ''
ON CONFLICT DO NOTHING;

-- 4.5 Enroll Lý
INSERT INTO enrollments (student_id, class_id)
SELECT DISTINCT 
    s.student_id,
    c.class_id
FROM ds_tong d
JOIN students s ON s.full_name = TRIM(COALESCE(d."HỌ", '') || ' ' || COALESCE(d."TÊN", ''))
JOIN classes c ON c.class_name = 'Lớp ' || d."LỚP" || TRIM(d."Lý") || ' - Lý'
WHERE d."Lý" IS NOT NULL AND TRIM(d."Lý") != ''
ON CONFLICT DO NOTHING;
