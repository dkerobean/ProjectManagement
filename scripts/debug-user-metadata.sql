-- Debug: Check what metadata your user actually has
-- Run this in your Supabase SQL Editor to see the current state

SELECT
    email,
    raw_user_meta_data,
    -- raw_user_meta_data is what becomes user_metadata in the client
    raw_user_meta_data->>'role' as role_from_raw_meta_data,
    raw_app_meta_data,
    raw_app_meta_data->>'role' as role_from_app_meta_data
FROM auth.users
WHERE email = 'admin@projectmgt.com';

-- Let's also try setting the role in app_metadata (this is more persistent)
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
    COALESCE(raw_app_meta_data, '{}'),
    '{role}',
    '"admin"'
)
WHERE email = 'admin@projectmgt.com';

-- And make sure it's also in user_metadata (raw_user_meta_data)
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'),
    '{role}',
    '"admin"'
)
WHERE email = 'admin@projectmgt.com';

-- Verify both are set
SELECT
    email,
    raw_user_meta_data->>'role' as user_metadata_role,
    raw_app_meta_data->>'role' as app_metadata_role,
    raw_user_meta_data,
    raw_app_meta_data
FROM auth.users
WHERE email = 'admin@projectmgt.com';
