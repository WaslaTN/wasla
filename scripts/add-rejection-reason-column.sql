-- Add rejection_reason column to station_partnership_requests table
ALTER TABLE station_partnership_requests 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add comment for documentation
COMMENT ON COLUMN station_partnership_requests.rejection_reason IS 'Reason provided when a partnership request is rejected';

-- Create index for better performance when filtering by rejection reason
CREATE INDEX IF NOT EXISTS idx_station_partnership_rejection_reason ON station_partnership_requests(rejection_reason);