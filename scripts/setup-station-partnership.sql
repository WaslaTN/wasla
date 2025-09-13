-- Station Partnership Request Table
CREATE TABLE IF NOT EXISTS station_partnership_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    governorate VARCHAR(255) NOT NULL,
    delegation VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    cin_front_url TEXT,
    cin_back_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_station_partnership_request_number ON station_partnership_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_station_partnership_status ON station_partnership_requests(status);
CREATE INDEX IF NOT EXISTS idx_station_partnership_created_at ON station_partnership_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_station_partnership_email ON station_partnership_requests(email);

-- Create storage bucket for station documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'station-documents',
    'station-documents',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policies for station documents bucket
CREATE POLICY "Public read access for station documents" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'station-documents');

CREATE POLICY "Public upload access for station documents" ON storage.objects
FOR INSERT TO public
WITH CHECK (bucket_id = 'station-documents');

CREATE POLICY "Public update access for station documents" ON storage.objects
FOR UPDATE TO public
USING (bucket_id = 'station-documents');

-- Enable Row Level Security
ALTER TABLE station_partnership_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Public can read all requests" ON station_partnership_requests
FOR SELECT TO public
USING (true);

CREATE POLICY "Public can insert requests" ON station_partnership_requests
FOR INSERT TO public
WITH CHECK (true);

CREATE POLICY "Public can update their own requests" ON station_partnership_requests
FOR UPDATE TO public
USING (true);

-- Create function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_station_partnership_requests_updated_at ON station_partnership_requests;
CREATE TRIGGER update_station_partnership_requests_updated_at
    BEFORE UPDATE ON station_partnership_requests
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Sample data for testing (optional)
-- INSERT INTO station_partnership_requests (
--     request_number,
--     first_name,
--     last_name,
--     email,
--     phone_number,
--     governorate,
--     delegation,
--     latitude,
--     longitude,
--     status
-- ) VALUES (
--     'SPR-1640995200-001',
--     'Ahmed',
--     'Ben Ali',
--     'ahmed.benali@example.com',
--     '+216 12 345 678',
--     'Tunis',
--     'Tunis Centre',
--     36.8065,
--     10.1815,
--     'pending'
-- );

-- Grant necessary permissions
GRANT ALL ON station_partnership_requests TO anon;
GRANT ALL ON station_partnership_requests TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
