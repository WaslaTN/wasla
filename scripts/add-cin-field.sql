-- Add CIN field to station_partnership_requests table
-- This script adds a CIN (Carte d'Identité Nationale) field to store the CIN number

-- Add the CIN column
ALTER TABLE station_partnership_requests 
ADD COLUMN IF NOT EXISTS cin VARCHAR(20);

-- Add a comment to describe the field
COMMENT ON COLUMN station_partnership_requests.cin IS 'Carte d''Identité Nationale (CIN) number of the applicant';

-- Create an index for better performance when searching by CIN
CREATE INDEX IF NOT EXISTS idx_station_partnership_cin ON station_partnership_requests(cin);

-- Update the existing RLS policies to include the new field
-- (The existing policies will automatically include the new column)

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'station_partnership_requests' 
AND column_name = 'cin'; 