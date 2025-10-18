-- SQL to fix incorrect roast_status values in roast_entries table
-- This fixes the bug where roasts were getting stuck as 'in_progress' instead of 'completed'

-- First, let's see the current state of roasts that might be incorrectly marked
SELECT 
    re.id,
    re.roast_status,
    re.weight_after_g,
    COUNT(re_events.id) AS event_count,
    MAX(CASE WHEN re_events.kind = 'END' THEN 1 ELSE 0 END) AS has_end_event
FROM roast_entries re
LEFT JOIN roast_events re_events ON re.id = re_events.roast_id
GROUP BY re.id, re.roast_status
ORDER BY re.id;

-- Update roasts that have END events but are still marked as 'in_progress' or 'planned'
UPDATE roast_entries 
SET roast_status = 'completed'
WHERE id IN (
    SELECT DISTINCT re.id
    FROM roast_entries re
    INNER JOIN roast_events re_events ON re.id = re_events.roast_id
    WHERE re.roast_status IN ('in_progress', 'planned')
    AND re_events.kind = 'END'
);

-- Update roasts that have weight_after_g but are still 'in_progress' or 'planned'
UPDATE roast_entries 
SET roast_status = 'completed'
WHERE roast_status IN ('in_progress', 'planned')
AND weight_after_g IS NOT NULL;

-- Mark truly empty roasts as 'cancelled' (no events, no weight)
UPDATE roast_entries 
SET roast_status = 'cancelled'
WHERE roast_status = 'in_progress'
AND weight_after_g IS NULL
AND id NOT IN (
    SELECT DISTINCT roast_id 
    FROM roast_events 
    WHERE roast_id IS NOT NULL
);

-- Optional: Mark abandoned roasts as cancelled (have some events but no END event and no final weight)
-- Uncomment the following if you want to clean up abandoned roasts:
/*
UPDATE roast_entries 
SET roast_status = 'cancelled'
WHERE roast_status = 'in_progress'
AND weight_after_g IS NULL
AND id IN (
    SELECT DISTINCT roast_id 
    FROM roast_events 
    WHERE roast_id IS NOT NULL
)
AND id NOT IN (
    SELECT DISTINCT roast_id 
    FROM roast_events 
    WHERE kind = 'END'
);
*/

-- Show the results after the fix
SELECT 
    re.id,
    re.roast_status,
    re.weight_after_g,
    COUNT(re_events.id) AS event_count,
    MAX(CASE WHEN re_events.kind = 'END' THEN 1 ELSE 0 END) AS has_end_event
FROM roast_entries re
LEFT JOIN roast_events re_events ON re.id = re_events.roast_id
GROUP BY re.id, re.roast_status
ORDER BY re.id;

