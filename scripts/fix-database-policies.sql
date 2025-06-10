-- Fix for infinite recursion in project_members table RLS policies
-- Run this in your Supabase SQL Editor

-- First, let's check what policies exist
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('users', 'project_members', 'projects')
ORDER BY tablename, policyname;

-- Disable RLS temporarily to avoid recursion issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Project members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Project members can view project members" ON public.project_members;

-- Create simple, non-recursive policies

-- Users table policies
CREATE POLICY "Enable read access for authenticated users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Projects table policies
CREATE POLICY "Enable read access for authenticated users" ON public.projects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Project members table policies
CREATE POLICY "Enable read access for authenticated users" ON public.project_members
    FOR SELECT USING (auth.role() = 'authenticated');

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Verify the new policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('users', 'project_members', 'projects')
ORDER BY tablename, policyname;
