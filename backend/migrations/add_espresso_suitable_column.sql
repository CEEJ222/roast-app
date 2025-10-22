-- Add espresso_suitable column to bean_profiles table
-- This migration adds the missing espresso_suitable boolean column

-- Add the column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bean_profiles' 
        AND column_name = 'espresso_suitable'
    ) THEN
        ALTER TABLE bean_profiles 
        ADD COLUMN espresso_suitable BOOLEAN DEFAULT FALSE;
        
        -- Add a comment to document the column
        COMMENT ON COLUMN bean_profiles.espresso_suitable IS 'Indicates if this bean is suitable for espresso brewing';
    END IF;
END $$;
