-- Run this in your Supabase SQL Editor to add the missing USN column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS usn TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'usn';
