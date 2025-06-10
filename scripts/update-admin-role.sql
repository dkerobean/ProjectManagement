-- Update user role in Supabase auth metadata
-- Run this in your Supabase SQL Editor

-- Method 1: Update your specific user's role in user_metadata
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{role}',
    '"admin"'
)
WHERE email = 'admin@projectmgt.com';

-- Method 2: Also update the user_metadata for good measure
UPDATE auth.users
SET user_metadata = jsonb_set(
    COALESCE(user_metadata, '{}'),
    '{role}',
    '"admin"'
)
WHERE email = 'admin@projectmgt.com';

-- Method 3: Update your user in the public.users table as well
UPDATE public.users
SET role = 'admin',
    updated_at = NOW()
WHERE email = 'admin@projectmgt.com';

-- Verify the changes
SELECT
    id,
    email,
    raw_user_meta_data,
    user_metadata,
    email_confirmed_at
FROM auth.users
WHERE email = 'admin@projectmgt.com';

-- Also check the public users table
SELECT
    id,
    email,
    name,
    role,
    timezone
FROM public.users
WHERE email = 'admin@projectmgt.com';
