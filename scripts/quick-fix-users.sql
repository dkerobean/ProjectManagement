-- Quick fix for development: Disable RLS on users table
-- Run this in your Supabase SQL Editor

-- Temporarily disable RLS on users table to avoid policy recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Check if user exists, if not create a basic profile
INSERT INTO public.users (
    id,
    email,
    name,
    role,
    timezone,
    created_at,
    updated_at
)
SELECT
    auth.users.id,
    auth.users.email,
    COALESCE(auth.users.raw_user_meta_data->>'name', split_part(auth.users.email, '@', 1)) as name,
    'member' as role,
    'UTC' as timezone,
    auth.users.created_at,
    NOW() as updated_at
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.users.id
);

-- Verify users exist
SELECT
    u.id,
    u.email,
    u.name,
    u.role,
    au.email_confirmed_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
ORDER BY u.created_at DESC;
