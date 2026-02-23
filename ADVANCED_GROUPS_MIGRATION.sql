-- Add mother_tongue to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mother_tongue TEXT;

-- Create Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('universal', 'private')),
    subject_code TEXT, -- linked to subject for universal groups
    creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    mother_tongue TEXT, -- for better matching in private groups
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Group Memberships (updated to link to the new groups table)
-- We'll keep the old table but might need to migrate data or create a new one.
-- Let's create a more flexible memberships table.
CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- 'creator', 'admin', 'member'
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Group Join Requests (for private groups)
CREATE TABLE IF NOT EXISTS group_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Messages table for mini-chatting
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Null if 1-on-1
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- Null if group chat
    content TEXT,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'voice', 'image')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for Groups
DROP POLICY IF EXISTS "Anyone can view universal groups" ON groups;
CREATE POLICY "Anyone can view universal groups" ON groups FOR SELECT USING (type = 'universal');

DROP POLICY IF EXISTS "Users can view private groups of their match" ON groups;
CREATE POLICY "Users can view private groups of their match" ON groups FOR SELECT USING (type = 'private');

DROP POLICY IF EXISTS "Users can create groups" ON groups;
CREATE POLICY "Users can create groups" ON groups FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id OR type = 'universal');

DROP POLICY IF EXISTS "Creators can manage their groups" ON groups;
CREATE POLICY "Creators can manage their groups" ON groups FOR ALL USING (auth.uid() = creator_id);

-- Policies for Memberships
DROP POLICY IF EXISTS "Members can see other members" ON study_group_members;
CREATE POLICY "Members can see other members" ON study_group_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can join universal groups" ON study_group_members;
CREATE POLICY "Users can join universal groups" ON study_group_members FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND type = 'universal')
);

DROP POLICY IF EXISTS "Creators can join their own groups" ON study_group_members;
CREATE POLICY "Creators can join their own groups" ON study_group_members FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
);

-- Policies for Requests
DROP POLICY IF EXISTS "Users can see their own requests" ON group_requests;
CREATE POLICY "Users can see their own requests" ON group_requests FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can see requests for their groups" ON group_requests;
CREATE POLICY "Creators can see requests for their groups" ON group_requests FOR SELECT USING (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create requests" ON group_requests;
CREATE POLICY "Users can create requests" ON group_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creators can update requests" ON group_requests;
CREATE POLICY "Creators can update requests" ON group_requests FOR UPDATE USING (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
);

-- Policies for Messages
DROP POLICY IF EXISTS "Members can see group messages" ON chat_messages;
CREATE POLICY "Members can see group messages" ON chat_messages FOR SELECT USING (
    group_id IS NOT NULL AND EXISTS (SELECT 1 FROM study_group_members WHERE group_id = chat_messages.group_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can see private messages" ON chat_messages;
CREATE POLICY "Users can see private messages" ON chat_messages FOR SELECT USING (
    receiver_id = auth.uid() OR sender_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Users can send messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
