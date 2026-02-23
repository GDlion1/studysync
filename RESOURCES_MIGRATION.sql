-- Create a table for resource metadata
CREATE TABLE IF NOT EXISTS resources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject_code TEXT NOT NULL,
    subject_name TEXT NOT NULL,
    branch TEXT NOT NULL,
    semester INTEGER NOT NULL,
    file_path TEXT NOT NULL, -- Path in storage bucket
    file_type TEXT, -- e.g., 'pdf', 'docx'
    file_size INTEGER, -- in bytes
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view resources
CREATE POLICY "Public can view resources" 
ON resources FOR SELECT 
TO public 
USING (true);

-- Policy: Authenticated users can upload resources
CREATE POLICY "Authenticated users can upload resources" 
ON resources FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = uploaded_by);

-- Policy: Users can delete their own resources
CREATE POLICY "Users can delete their own resources" 
ON resources FOR DELETE 
TO authenticated 
USING (auth.uid() = uploaded_by);

-- Create storage bucket for study materials
INSERT INTO storage.buckets (id, name, public) 
VALUES ('study_materials', 'study_materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies

-- Allow public read access to files
CREATE POLICY "Public can view study materials" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'study_materials' );

-- Allow authenticated upload
CREATE POLICY "Authenticated users can upload study materials" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK ( bucket_id = 'study_materials' AND auth.uid() = owner);

-- Allow users to update/delete their own files
CREATE POLICY "Users can update their own study materials" 
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'study_materials' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own study materials" 
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'study_materials' AND auth.uid() = owner);
