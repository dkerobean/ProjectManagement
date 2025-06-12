## Manual SQL Commands to Fix Projects Table Policies

Execute these commands in your Supabase SQL Editor to fix the infinite recursion issue:

```sql
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Projects are viewable by members" ON projects;
DROP POLICY IF EXISTS "Projects can be inserted by authenticated users" ON projects;
DROP POLICY IF EXISTS "Projects can be updated by owners and admins" ON projects;
DROP POLICY IF EXISTS "Projects can be deleted by owners" ON projects;

-- Create safe, non-recursive policies
CREATE POLICY "Projects viewable by members" ON projects
    FOR SELECT USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = projects.id
            AND project_members.user_id = auth.uid()
        )
    );

CREATE POLICY "Projects insertable by authenticated users" ON projects
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND
        auth.uid() = owner_id
    );

CREATE POLICY "Projects updatable by owners and admins" ON projects
    FOR UPDATE USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM project_members
            WHERE project_members.project_id = projects.id
            AND project_members.user_id = auth.uid()
            AND project_members.role IN ('owner', 'admin')
        )
    );

CREATE POLICY "Projects deletable by owners" ON projects
    FOR DELETE USING (
        auth.uid() = owner_id OR
        auth.role() = 'service_role'
    );
```

## Optional: Remove Budget Column

If you don't need the budget field, also run:

```sql
ALTER TABLE projects DROP COLUMN IF EXISTS budget;
```

## Verify Policies

Check that policies are working:

```sql
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'projects';
```
