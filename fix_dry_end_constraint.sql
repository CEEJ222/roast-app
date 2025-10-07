-- Quick fix for DRY_END constraint issue
-- Run this in your Supabase SQL editor

-- Drop the existing constraint
ALTER TABLE roast_events DROP CONSTRAINT IF EXISTS roast_events_kind_check;

-- Add the new constraint with DRY_END included
ALTER TABLE roast_events ADD CONSTRAINT roast_events_kind_check 
CHECK (kind IN ('SET', 'FIRST_CRACK', 'SECOND_CRACK', 'COOL', 'END', 'DRY_END'));

-- Verify the constraint was added
SELECT conname FROM pg_constraint WHERE conname = 'roast_events_kind_check';
