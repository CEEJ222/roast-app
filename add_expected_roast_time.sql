-- Add expected_roast_time_minutes column to roast_entries table
-- This stores the user's planned roast time for historical analysis

ALTER TABLE roast_entries 
ADD COLUMN expected_roast_time_minutes INTEGER;

-- Add a comment to document the purpose
COMMENT ON COLUMN roast_entries.expected_roast_time_minutes IS 'Expected roast time in minutes as planned by the user at roast start';
