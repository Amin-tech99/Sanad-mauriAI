# Render Deployment Guide for Sanad MauriAI

This guide will help you deploy your Sanad MauriAI translation platform to Render.

## Prerequisites

1. GitHub account
2. Render account (sign up at [render.com](https://render.com))
3. Your code pushed to a GitHub repository

## Step-by-Step Deployment

### 1. Push Your Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo-name.git
git push -u origin main
```

### 2. Create PostgreSQL Database on Render

1. Go to your [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "PostgreSQL"
3. Fill in the details:
   - **Name**: `sanad-db` (or any name you prefer)
   - **User**: Leave default or customize
   - **Database**: Leave default or customize
   - **Region**: Choose closest to your users
   - **Plan**: Select "Free" for development
4. Click "Create Database"
5. **Important**: Copy the "Internal Database URL" - you'll need this

### 3. Deploy Web Service

1. In Render Dashboard, click "New +" → "Web Service"
2. Connect your GitHub repository
3. Fill in the configuration:
   - **Name**: `sanad-mauriai` (or your preferred name)
   - **Runtime**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free" for development

### 4. Configure Environment Variables

In the web service settings, add these environment variables:

1. **DATABASE_URL**: Paste the Internal Database URL from your PostgreSQL database
2. **NODE_ENV**: `production`

### 5. Initialize Database Schema

After your first deployment:

1. Go to your web service dashboard
2. Click "Shell" (or use Render's console)
3. Run: `npm run db:push`

This will create all the necessary database tables.

## Important Notes

- **Free Tier Limitations**: 
  - Web service spins down after 15 minutes of inactivity
  - Database has limited storage and connections
  - Perfect for development and testing

- **Custom Domain**: You can add your own domain in the service settings

- **Automatic Deploys**: Enable auto-deploy to automatically deploy when you push to GitHub

- **Environment Variables**: Never commit your `.env` file. Always set environment variables in Render's dashboard

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check the build logs in Render dashboard
2. **Database Connection**: Ensure DATABASE_URL is correctly set
3. **Port Issues**: The app automatically uses Render's PORT environment variable

### Health Check:

Your app includes a health check endpoint. Render will automatically monitor your service health.

## Production Optimizations

For production use:

1. Upgrade to paid plans for better performance
2. Set up monitoring and alerts
3. Configure custom domains
4. Enable CDN for static assets
5. Set up proper backup strategies for your database

## Support

- [Render Documentation](https://render.com/docs)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)

---

Your Sanad MauriAI platform is now ready for deployment on Render! 🚀
