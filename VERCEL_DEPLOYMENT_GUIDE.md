# 🚀 Vercel Deployment Guide

## Prerequisites

1. **GitHub Account**: Create a GitHub account if you don't have one
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free tier available)
3. **Database**: Set up a PostgreSQL database (recommended: [Neon](https://neon.tech/))

## Step 1: Push to GitHub

1. **Create a new repository on GitHub**:
   - Go to [github.com](https://github.com)
   - Click "New repository"
   - Name it `sanad-mauriai-platform` (or any name you prefer)
   - Make it public or private
   - Don't initialize with README (we already have one)

2. **Push your code**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Set Up Database (Neon - Recommended)

1. **Create Neon Account**:
   - Go to [neon.tech](https://neon.tech/)
   - Sign up for free account
   - Create a new project

2. **Get Connection String**:
   - Copy the connection string from Neon dashboard
   - It looks like: `postgresql://username:password@hostname/database?sslmode=require`

## Step 3: Deploy to Vercel

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your GitHub repository

2. **Configure Environment Variables**:
   In Vercel dashboard, add these environment variables:
   ```
   DATABASE_URL=your_neon_connection_string_here
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production-xyz123
   NODE_ENV=production
   ```

3. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically build and deploy your app
   - Wait for deployment to complete

## Step 4: Initialize Database

After successful deployment:

1. **Access Vercel Functions**:
   - Go to your Vercel project dashboard
   - Click on "Functions" tab
   - Find your deployment URL

2. **Run Database Setup**:
   You can initialize the database by visiting these URLs in your browser:
   ```
   https://your-app-name.vercel.app/api/setup-db
   ```
   
   Or use the Vercel CLI:
   ```bash
   npx vercel env pull .env.local
   npm run db:push
   npx tsx scripts/init-platform-features.ts
   ```

## Step 5: Test Your Deployment

1. **Visit Your App**:
   - Go to your Vercel deployment URL
   - Test login functionality
   - Create a test user account
   - Verify all features work

2. **Check Platform Features**:
   - Login as admin
   - Go to Platform Control
   - Verify all features are available

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Error**:
   - Verify `DATABASE_URL` is correct
   - Ensure database allows connections from Vercel IPs
   - Check if SSL is required (`?sslmode=require`)

2. **Build Errors**:
   - Check Vercel build logs
   - Ensure all dependencies are in `package.json`
   - Verify TypeScript compilation

3. **Session Issues**:
   - Ensure `SESSION_SECRET` is set
   - Check if cookies are working in production

### Environment Variables Checklist:
- ✅ `DATABASE_URL`: PostgreSQL connection string
- ✅ `SESSION_SECRET`: Secure random string (min 32 characters)
- ✅ `NODE_ENV`: Set to "production"

## 🎉 Success!

Your Sanad MauriAI Translation Platform is now live on Vercel!

### Next Steps:
1. Set up your admin account
2. Configure platform features
3. Add your translation team
4. Start creating translation projects

### Useful Links:
- **Your App**: `https://your-app-name.vercel.app`
- **Vercel Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Neon Dashboard**: [console.neon.tech](https://console.neon.tech)

## 📞 Support

If you encounter any issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test database connectivity
4. Review the troubleshooting section above

Happy translating! 🌍✨