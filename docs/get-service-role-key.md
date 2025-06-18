# 🔑 How to Get Your Supabase Service Role Key

## Problem
Your current `.env.local` file has a placeholder value for the service role key, which is why you're getting the "does not look like a valid JWT token" error.

## Solution

### Step 1: Go to Supabase Dashboard
Visit: https://supabase.com/dashboard/project/gafpwitcdoiviixlxnuz/settings/api

### Step 2: Find the Service Role Key
1. Look for the section titled "Project API keys"
2. You'll see two keys:
   - **anon** key (already in your .env.local)
   - **service_role** key ← This is what you need

### Step 3: Copy the Service Role Key
- The service role key should:
  - Start with `eyJ`
  - Be around 200-300 characters long
  - Look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQ2NDE1OSwiZXhwIjoyMDY1MDQwMTU5fQ.LONG_STRING_HERE`

### Step 4: Update .env.local
Replace this line in your `.env.local`:
```
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_ACTUAL_SERVICE_ROLE_KEY_FROM_DASHBOARD
```

With:
```
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ACTUAL_SERVICE_ROLE_KEY_HERE
```

### Step 5: Restart Development Server
```bash
# Stop current server (Ctrl+C)
npm run dev
```

## Temporary Fix (Current State)
I've updated the code to use a fallback approach, so your app should work now even without the service role key, but:
- ✅ Basic functionality will work
- ⚠️ Some advanced features may be limited
- 🎯 Get the real service role key for full functionality

## Test
After getting the real key, test it at: http://localhost:3000/api/test-service-role

The current placeholder key you have is only 51 characters and doesn't start with `eyJ`, which confirms it's not the real JWT token.
