# Vercel Deployment Checklist

## Environment Variables to Set in Vercel Dashboard

### Required for Authentication
```bash
NEXTAUTH_URL=https://your-actual-vercel-domain.vercel.app
NEXTAUTH_SECRET=XcuQMEX+K/UmX8rZGotB4N42N4wt9CoGMcfwPk/8i5E=
```

### Supabase Configuration
```bash
NEXT_PUBLIC_SUPABASE_URL=https://gafpwitcdoiviixlxnuz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NjQxNTksImV4cCI6MjA2NTA0MDE1OX0.RNdmc2PkTYA6oQ-4HRPoRp-z-iinT8v5d6pWx9YRPhk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZnB3aXRjZG9pdmlpeGx4bnV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTQ2NDE1OSwiZXhwIjoyMDY1MDQwMTU5fQ.Y7AC2Pd-zkHyVnQc-eiw0EmqzmtL8gjEcpnAareTb6c
```

### OAuth Providers (if using)
```bash
GITHUB_AUTH_CLIENT_ID=your_github_client_id
GITHUB_AUTH_CLIENT_SECRET=your_github_client_secret
GOOGLE_AUTH_CLIENT_ID=your_google_client_id
GOOGLE_AUTH_CLIENT_SECRET=your_google_client_secret
```

### Environment Setting
```bash
NODE_ENV=production
```

## Steps to Deploy

1. **Set Environment Variables in Vercel Dashboard**
   - Go to your Vercel project settings
   - Navigate to Environment Variables
   - Add all variables listed above
   - **CRITICAL**: Replace `your-actual-vercel-domain.vercel.app` with your real Vercel URL

2. **Update OAuth Provider Settings**
   - GitHub OAuth App: Add redirect URI `https://your-vercel-domain.vercel.app/api/auth/callback/github`
   - Google OAuth App: Add redirect URI `https://your-vercel-domain.vercel.app/api/auth/callback/google`

3. **Deploy**
   - Push your code to trigger deployment
   - Or manually redeploy from Vercel dashboard

4. **Verify**
   - Check deployment logs for any localhost warnings
   - Test sign-in flow
   - Verify redirects go to your Vercel domain, not localhost

## Common Issues

### Issue: Redirects to localhost in production
**Cause**: `NEXTAUTH_URL` not properly set in Vercel
**Fix**: Set `NEXTAUTH_URL=https://your-vercel-domain.vercel.app` in Vercel dashboard

### Issue: Authentication errors
**Cause**: OAuth callback URLs not updated
**Fix**: Update GitHub/Google OAuth app settings with Vercel domain

### Issue: Database connection errors
**Cause**: Supabase environment variables not set
**Fix**: Verify all Supabase env vars are set in Vercel dashboard

## Testing
After deployment, test:
- [ ] Sign in with credentials
- [ ] Sign in with GitHub (if enabled)
- [ ] Sign in with Google (if enabled)
- [ ] Verify redirect goes to `https://your-vercel-domain.vercel.app/dashboards/project`
- [ ] Check browser console for any localhost warnings
