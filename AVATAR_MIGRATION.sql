-- Run this in your Supabase SQL Editor to add the missing avatar_url column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'avatar_url';

-- OPTIONAL: If you haven't set up the 'avatars' storage bucket yet, you can try running this:
-- Note: Requires permissions to modify storage schema.
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- create policy "Avatar images are publicly accessible." on storage.objects for select using ( bucket_id = 'avatars' );
-- create policy "Anyone can upload an avatar." on storage.objects for insert with check ( bucket_id = 'avatars' );
