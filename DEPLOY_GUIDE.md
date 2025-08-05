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
- In settings, set "Root Directory" to: `server`
- Railway will auto-detect Node.js and deploy

### 4. Set Environment Variables
Click on your Node.js service → "Variables" tab → Add these:

```
PORT=3001
DB_HOST=${{MySQL.MYSQL_PRIVATE_URL}}
DB_USER=root  
DB_PASSWORD=${{MySQL.MYSQL_PASSWORD}}
DB_NAME=railway
JWT_SECRET=your_super_secret_random_string_here_make_it_long
NODE_ENV=production
```

**Note:** Replace `your_super_secret_random_string_here_make_it_long` with a random string!

### 5. Get Backend URL
- Once deployed, copy your backend URL (e.g., `https://xyz.railway.app`)
- You'll need this for frontend deployment

---

## Part 2: Deploy Frontend to Vercel

### 1. Sign up to Vercel  
- Go to: https://vercel.com
- Click "Sign Up" → "Continue with GitHub"

### 2. Import Project
- Click "Add New" → "Project"
- Import `junmats/fambam` repository

### 3. Configure Build Settings
- Framework Preset: "Create React App"
- Root Directory: `client` 
- Build Command: `npm run build`
- Output Directory: `build`

### 4. Set Environment Variables
Before deploying, add this variable:
```
REACT_APP_API_URL=https://your-railway-backend-url.railway.app
```
(Replace with your actual Railway backend URL from Part 1)

### 5. Deploy
- Click "Deploy"
- Wait 2-3 minutes for build to complete

---

## 🎉 You're Live!

Your app will be available at:
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.railway.app`

## Next Steps:
1. Test registration and login
2. Add some family members
3. Share with family!

## Need Help?
Check `DEPLOYMENT.md` for troubleshooting tips.
