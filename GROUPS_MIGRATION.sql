-- Create a table to track which groups (subjects) a user has joined
CREATE TABLE IF NOT EXISTS group_memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    semester INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, subject_code) -- User can only join a subject group once
);

-- Enable RLS
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own memberships
CREATE POLICY "Users can view their own memberships" 
ON group_memberships FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Allow users to join a group
CREATE POLICY "Users can join groups" 
ON group_memberships FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Allow users to leave a group
CREATE POLICY "Users can leave groups" 
ON group_memberships FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);
