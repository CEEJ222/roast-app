-- Add missing columns to roast_entries table
-- Run this in your Supabase SQL editor

ALTER TABLE roast_entries 
ADD COLUMN IF NOT EXISTS t_dry_end_sec INTEGER,
ADD COLUMN IF NOT EXISTS t_dry_end INTEGER;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'roast_entries' 
AND column_name IN ('t_dry_end_sec', 't_dry_end');
