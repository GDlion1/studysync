-- 1. Create Resources Table
CREATE TABLE IF NOT EXISTS study_resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    file_url TEXT NOT NULL,
    file_type TEXT, -- 'pdf', 'image', 'link'
    category TEXT, -- 'notes', 'previous_year', 'lab', 'other'
    subject_code TEXT,
    uploader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE, -- Null if public resource
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Group Goals (Tasks) Table
CREATE TABLE IF NOT EXISTS group_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS
ALTER TABLE study_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_goals ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Resources
CREATE POLICY "Public resources are viewable by everyone" ON study_resources FOR SELECT USING (group_id IS NULL);
CREATE POLICY "Group members can view group resources" ON study_resources FOR SELECT USING (
    group_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_resources.group_id AND user_id = auth.uid())
        OR 
        EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
    )
);
CREATE POLICY "Authenticated users can upload public resources" ON study_resources FOR INSERT TO authenticated WITH CHECK (group_id IS NULL AND auth.uid() = uploader_id);
CREATE POLICY "Members/Leaders can upload group resources" ON study_resources FOR INSERT TO authenticated WITH CHECK (
    group_id IS NOT NULL AND (
        EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
        OR 
        EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_resources.group_id AND user_id = auth.uid())
    )
);

-- 5. Policies for Goals
CREATE POLICY "Members/Leaders can see goals" ON group_goals FOR SELECT USING (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = group_goals.group_id AND user_id = auth.uid())
);
CREATE POLICY "Leaders can manage goals" ON group_goals FOR ALL USING (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
);
CREATE POLICY "Members can update goal status" ON group_goals FOR UPDATE USING (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = group_goals.group_id AND user_id = auth.uid())
) WITH CHECK (
    -- Allow members only to change the status
    (SELECT status FROM group_goals WHERE id = group_goals.id) IS DISTINCT FROM status
);

-- 6. Add file_url to chat_messages for attachments
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE chat_messages DROP CONSTRAINT IF EXISTS chat_messages_message_type_check;
ALTER TABLE chat_messages ADD CONSTRAINT chat_messages_message_type_check CHECK (message_type IN ('text', 'voice', 'image', 'file', 'pdf'));
