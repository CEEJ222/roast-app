-- Add missing t_dry_end columns to roast_entries table
-- This fixes the issue where clicking "Dry End" fails because the columns don't exist

-- Add the missing columns
ALTER TABLE roast_entries 
ADD COLUMN IF NOT EXISTS t_dry_end_sec INTEGER,
ADD COLUMN IF NOT EXISTS t_dry_end INTEGER;

-- Add comments to document the purpose
COMMENT ON COLUMN roast_entries.t_dry_end_sec IS 'Time in seconds when dry end milestone was reached';
COMMENT ON COLUMN roast_entries.t_dry_end IS 'Time in minutes when dry end milestone was reached';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'roast_entries' 
AND column_name IN ('t_dry_end_sec', 't_dry_end');
