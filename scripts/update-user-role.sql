-- Update user metadata to include role information
-- Run this in your Supabase SQL Editor

-- Method 1: Update user_metadata to include role (recommended)
UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'admin@projectmgt.com';

-- Method 2: Update app_metadata to include role (alternative)
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'admin@projectmgt.com';

-- Verify the update
SELECT
    id,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    email_confirmed_at
FROM auth.users
WHERE email = 'admin@projectmgt.com';
