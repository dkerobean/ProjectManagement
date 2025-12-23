# GoldTrader Pro - Deployment Guide

## Prerequisites

1. **MongoDB Atlas Account** (or self-hosted MongoDB)
2. **Vercel Account** (free tier works)
3. **Node.js 18+**

---

## Step 1: Prepare MongoDB

### Option A: MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier available)
3. Create database user with read/write access
4. Whitelist IP addresses (or allow all: `0.0.0.0/0`)
5. Get connection string:
    ```
    mongodb+srv://<username>:<password>@<cluster>.mongodb.net/goldtrader
    ```

### Option B: Existing MongoDB

Use your existing MongoDB connection string.

---

## Step 2: Deploy to Vercel

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd /path/to/ProjectMgt
vercel

# Set environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
```

### Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import Git repository
3. Add environment variables:
    - `MONGODB_URI` - Your MongoDB connection string
    - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
    - `NEXTAUTH_URL` - Your Vercel domain (e.g., `https://goldtrader.vercel.app`)
4. Deploy

---

## Step 3: Verify Deployment

### Test Checklist

- [ ] Homepage loads (`/gold`)
- [ ] Can add supplier
- [ ] Can record buy transaction
- [ ] Can record sell transaction
- [ ] Vault updates correctly
- [ ] Reports generate
- [ ] PDF export works
- [ ] Settings save
- [ ] Offline mode works (disconnect network, try transaction)

---

## Environment Variables Reference

| Variable          | Required | Description               |
| ----------------- | -------- | ------------------------- |
| `MONGODB_URI`     | ✅       | MongoDB connection string |
| `NEXTAUTH_SECRET` | ✅       | Auth encryption key       |
| `NEXTAUTH_URL`    | ✅       | Production URL            |
| `METALS_API_KEY`  | ❌       | Live price API (optional) |

---

## Troubleshooting

### MongoDB Connection Fails

- Check IP whitelist in Atlas
- Verify username/password
- Test locally with same connection string

### Auth Issues

- Ensure `NEXTAUTH_URL` matches your domain exactly
- Regenerate `NEXTAUTH_SECRET` if needed

### Build Errors

```bash
npm run build
```

Check for TypeScript errors locally first.

---

## Post-Deployment

1. **Test on mobile** - Open on phone, test all features
2. **Install as PWA** - Add to home screen
3. **Share with client** for user acceptance testing
