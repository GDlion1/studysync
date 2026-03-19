-- 1. Ensure PROFILES are visible to everyone (needed for chat names/avatars)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
FOR SELECT USING (true);

-- 2. Simplified Chat Policies (More robust for Leaders and Members)
DROP POLICY IF EXISTS "Everyone in group can see messages" ON chat_messages;
DROP POLICY IF EXISTS "Members/Leaders can see group messages" ON chat_messages;
CREATE POLICY "View messages" ON chat_messages 
FOR SELECT USING (
    EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = chat_messages.group_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Everyone in group can send messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can send messages" ON chat_messages;
CREATE POLICY "Send messages" ON chat_messages 
FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
        EXISTS (SELECT 1 FROM groups WHERE id = group_id AND creator_id = auth.uid())
        OR 
        EXISTS (SELECT 1 FROM study_group_members WHERE group_id = chat_messages.group_id AND user_id = auth.uid())
    )
);

-- 3. Make sure you are in the members table (Creator fix)
-- Sometimes leaders aren't added to members table, this allows them to see everything anyway.
DROP POLICY IF EXISTS "Members can see other members" ON study_group_members;
CREATE POLICY "Members/Leaders can see members" ON study_group_members 
FOR SELECT USING (true);
