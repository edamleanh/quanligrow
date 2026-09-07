-- =============================================================================
-- MIGRATION: MAKE TEACHER PHONE NUMBER OPTIONAL
-- =============================================================================

-- 1. Drop NOT NULL constraint on teachers.phone
ALTER TABLE teachers ALTER COLUMN phone DROP NOT NULL;

-- 2. Update CHECK constraint to allow NULL or empty string or 10-11 digits
ALTER TABLE teachers DROP CONSTRAINT IF EXISTS check_teacher_phone;
ALTER TABLE teachers ADD CONSTRAINT check_teacher_phone CHECK (phone IS NULL OR phone = '' OR phone ~ '^[0-9]{10,11}$');
