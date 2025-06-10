-- Correct SQL to update user role in Supabase
-- Run this in your Supabase SQL Editor

-- Update user role in Supabase auth metadata (only raw_user_meta_data exists)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{role}',
    '"admin"'
)
WHERE email = 'admin@projectmgt.com';

-- Update your user in the public.users table as well
UPDATE public.users
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'admin@projectmgt.com';

-- Verify the changes
SELECT
    email,
    raw_user_meta_data->>'role' as role_from_metadata,
    raw_user_meta_data
FROM auth.users
WHERE email = 'admin@projectmgt.com';

-- Also check the public users table
SELECT
    email,
    role,
    name
FROM public.users
WHERE email = 'admin@projectmgt.com';
