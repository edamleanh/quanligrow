-- =============================================================================
-- MIGRATION SCRIPT: Upgrade `batches` table to support 12 batches per class & status
-- =============================================================================

-- 1. Create Enum for Batch Status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_status') THEN
        CREATE TYPE batch_status AS ENUM ('DANG_HOC', 'UPCOMING', 'COMPLETED');
    END IF;
END $$;

-- 2. Add columns to `batches` table if not exists
ALTER TABLE batches ADD COLUMN IF NOT EXISTS batch_number INT CONSTRAINT check_batch_number CHECK (batch_number BETWEEN 1 AND 12);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS status batch_status NOT NULL DEFAULT 'UPCOMING';
ALTER TABLE batches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Add Unique constraint on (class_id, batch_number)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_class_batch_number'
    ) THEN
        ALTER TABLE batches ADD CONSTRAINT unique_class_batch_number UNIQUE (class_id, batch_number);
    END IF;
END $$;

-- 3. Auto Generate 12 Batches Trigger Function for New Classes
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

DROP TRIGGER IF EXISTS trg_classes_after_insert_create_batches ON classes;
CREATE TRIGGER trg_classes_after_insert_create_batches
AFTER INSERT ON classes
FOR EACH ROW EXECUTE FUNCTION trigger_auto_create_12_batches();

-- 4. Populate 12 Batches for all existing classes
DO $$
DECLARE
    c RECORD;
    i INT;
BEGIN
    FOR c IN SELECT class_id, default_fee_rate FROM classes LOOP
        FOR i IN 1..12 LOOP
            INSERT INTO batches (class_id, batch_number, batch_name, fee_rate, status)
            VALUES (
                c.class_id,
                i,
                'Đợt ' || i,
                c.default_fee_rate,
                CASE WHEN i = 1 THEN 'DANG_HOC'::batch_status ELSE 'UPCOMING'::batch_status END
            )
            ON CONFLICT (class_id, batch_number) DO UPDATE
            SET batch_name = EXCLUDED.batch_name,
                fee_rate = EXCLUDED.fee_rate;
        END LOOP;
    END FOR;
END $$;
