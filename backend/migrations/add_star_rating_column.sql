ALTER TABLE roast_entries 
ADD COLUMN IF NOT EXISTS star_rating DECIMAL(2,1) CHECK (star_rating IS NULL OR (star_rating >= 0.5 AND star_rating <= 5.0));