-- Quick fix for infinite recursion in RLS policies
-- This script temporarily addresses the login issue

-- First, let's check the current policies on users table
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users';

-- Temporarily disable RLS on users table for testing
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable with a simple policy for now
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a basic policy that allows authenticated users to see their own data
-- and allows service role access
DROP POLICY IF EXISTS "Users can view own data" ON users;
CREATE POLICY "Users can view own data" ON users
    FOR ALL USING (
        auth.uid() = id OR
        auth.role() = 'service_role'
    );

-- Allow authenticated users to view basic user info for project collaboration
DROP POLICY IF EXISTS "Users can view project member data" ON users;
CREATE POLICY "Users can view project member data" ON users
    FOR SELECT USING (
        auth.uid() = id OR
        auth.role() = 'service_role' OR
        EXISTS (
            SELECT 1 FROM project_members pm1
            JOIN project_members pm2 ON pm1.project_id = pm2.project_id
            WHERE pm1.user_id = auth.uid() AND pm2.user_id = users.id
        )
    );
