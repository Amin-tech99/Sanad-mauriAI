# Vercel Environment Variables Setup

## 🚨 URGENT: Fix 500 API Errors

Your app is getting 500 errors because Vercel doesn't have access to your environment variables.

## Required Environment Variables

Add these to your Vercel project:

### 1. DATABASE_URL
```
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

**Options:**
- **Neon** (Recommended for Vercel): https://neon.tech/
- **Supabase**: https://supabase.com/
- **Railway**: https://railway.app/
- **PlanetScale**: https://planetscale.com/

### 2. SESSION_SECRET
```
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

Generate a secure secret: https://generate-secret.vercel.app/32

## How to Add Variables

### Method 1: Vercel Dashboard (Easiest)
1. Go to: https://vercel.com/dashboard
2. Select your project: `sanad-mauri-ai`
3. Go to **Settings** → **Environment Variables**
4. Add both variables above
5. **Redeploy** your project

### Method 2: Vercel CLI
```bash
vercel env add DATABASE_URL
vercel env add SESSION_SECRET
vercel --prod
```

## After Adding Variables
1. **Redeploy** your project (automatic or manual)
2. **Test** login/register functionality
3. **Check** Vercel function logs if issues persist

## Database Setup (if needed)

### Quick Neon Setup:
1. Go to https://neon.tech/
2. Create free account
3. Create new project
4. Copy connection string
5. Add to Vercel as DATABASE_URL

### Connection String Format:
```
postgresql://username:password@hostname/database?sslmode=require
```

## Verification
After setup, test these endpoints:
- `https://sanad-mauri-ai.vercel.app/api/user` (should return 401, not 500)
- Login/Register forms should work without 500 errors