-- Create Study Sessions table
CREATE TABLE IF NOT EXISTS study_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    session_type TEXT DEFAULT 'discussion' CHECK (session_type IN ('discussion', 'quiet_focus', 'mentorship')),
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Policies for Sessions
DROP POLICY IF EXISTS "Anyone can view sessions" ON study_sessions;
CREATE POLICY "Anyone can view sessions" ON study_sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Members can create sessions for their groups" ON study_sessions;
CREATE POLICY "Members can create sessions for their groups" ON study_sessions FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM study_group_members WHERE group_id = study_sessions.group_id AND user_id = auth.uid())
);

DROP POLICY IF EXISTS "Creators can manage their sessions" ON study_sessions;
CREATE POLICY "Creators can manage their sessions" ON study_sessions FOR ALL USING (auth.uid() = created_by);
