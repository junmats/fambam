# 🚀 Step-by-Step Deployment Guide

## Part 1: Deploy Backend to Railway

### 1. Sign up to Railway
- Go to: https://railway.app
- Click "Login" → "Login with GitHub"
- Authorize Railway to access your GitHub

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose: `junmats/fambam`

### 3. Configure Services
Once project is created:

**Add MySQL Database:**
- Click "Add Service" → "Database" → "Add MySQL"
- Wait for it to deploy (2-3 minutes)

**Add Backend Service:**
- Click "Add Service" → "GitHub Repo" → Select `junmats/fambam`
- **IMPORTANT:** In settings, set "Root Directory" to: `/server` (or leave empty if deploying from root)
- **Build Command:** Leave empty (auto-detected)
- **Start Command:** `node index.js`
- Railway will auto-detect Node.js and deploy

### 4. Set Environment Variables
Click on your Node.js service → "Variables" tab → Add these:

```
PORT=3001
DB_HOST=${{MySQL.MYSQL_PRIVATE_URL}}
DB_USER=root  
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=railway
JWT_SECRET=VIk5M86z4wY8uH2nkH2oE1mgZenguJ6bSn2QdjAmea9Aw6Y6k9Egs5P1jIbeNNb4Tg80kldvKPXalVhkkGA
NODE_ENV=production
```

### 5. Get Backend URL
- Once deployed, copy your backend URL (e.g., `https://xyz.railway.app`)
- You'll need this for frontend deployment

---

## Part 2: Deploy Frontend to Vercel

### 1. Sign up to Vercel  
- Go to: https://vercel.com
- Click "Sign Up" → "Continue with GitHub"
- Authorize Vercel to access your GitHub repositories

### 2. Import Project
- Click "Add New" → "Project"
- Find and import `junmats/fambam` repository
- Click "Import"

### 3. Configure Build Settings
**IMPORTANT:** Before deploying, configure these settings:

- **Framework Preset:** Create React App
- **Root Directory:** `client` 
- **Build Command:** `npm run build`
- **Output Directory:** `build`
- **Install Command:** `npm install`

### 4. Set Environment Variables
**BEFORE clicking Deploy**, add this environment variable:

- **Name:** `REACT_APP_API_URL`
- **Value:** `https://your-railway-backend-url.railway.app` 

*Replace with your actual Railway backend URL from Part 1*

### 5. Deploy
- Click "Deploy"
- Wait 2-3 minutes for build to complete
- Your frontend will be live!

### 6. Test Your App
- Visit your new Vercel URL
- Try registering a new account
- Test login functionality
- Add a family member to verify everything works

---

## 🎉 You're Live!

Your family tree app is now fully deployed:
- **Frontend:** `https://your-project.vercel.app`
- **Backend:** `https://your-backend.railway.app`

## Final Steps:
1. **Test the full app:**
   - Registration and login
   - Adding family members
   - Uploading photos
   - Creating relationships

2. **Share with family:**
   - Send them the Vercel URL
   - They can register and start building the family tree!

3. **Optional: Custom Domain**
   - In Vercel, go to Project → Settings → Domains
   - Add your custom domain if you have one

## 🔧 Troubleshooting:
- **API calls failing?** Check that `REACT_APP_API_URL` is set correctly in Vercel
- **Database connection issues?** Verify Railway MySQL is running
- **Build failing?** Ensure Root Directory is set to `client` in Vercel
- **Environment variables not working?** Redeploy after adding them
