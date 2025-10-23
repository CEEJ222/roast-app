-- Add star_rating column to roast_entries table
-- This allows users to rate their roasts on a 1-5 star scale

ALTER TABLE roast_entries 
ADD COLUMN IF NOT EXISTS star_rating INTEGER CHECK (star_rating >= 1 AND star_rating <= 5);

-- Add comment for documentation
COMMENT ON COLUMN roast_entries.star_rating IS 'User rating for the roast on a 1-5 star scale';
