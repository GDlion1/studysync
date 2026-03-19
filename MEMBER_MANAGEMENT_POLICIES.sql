-- Allow group creators to remove members from their circles
DROP POLICY IF EXISTS "Creators can remove members" ON study_group_members;
CREATE POLICY "Creators can remove members" ON study_group_members 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_id 
        AND groups.creator_id = auth.uid()
    )
);

-- Also allow creators to update/delete join requests fully
DROP POLICY IF EXISTS "Creators can delete requests" ON group_requests;
CREATE POLICY "Creators can delete requests" ON group_requests 
FOR DELETE 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM groups 
        WHERE groups.id = group_id 
        AND groups.creator_id = auth.uid()
    )
);
