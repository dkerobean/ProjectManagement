-- Script to manually verify email addresses in Supabase
-- Run this in your Supabase SQL Editor

-- Method 1: Verify a specific user by email
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'user@example.com'
AND email_confirmed_at IS NULL;

-- Method 2: Verify a specific user by ID
UPDATE auth.users
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE id = 'user-uuid-here'
AND email_confirmed_at IS NULL;

-- Method 3: Verify all unverified users (use with caution!)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW(),
--     updated_at = NOW()
-- WHERE email_confirmed_at IS NULL;

-- Check verification status of users
SELECT
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE
        WHEN email_confirmed_at IS NOT NULL THEN 'Verified'
        ELSE 'Unverified'
    END as verification_status
FROM auth.users
ORDER BY created_at DESC;
