# FamALLE Deployment Guide

## 🚀 Quick Deploy

### Frontend (Vercel)
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository: `junmats/fambam`
4. Deploy settings:
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/build`
   - Install Command: `cd client && npm install`

### Backend (Railway)
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Create new project → Deploy from GitHub repo
4. Select: `junmats/fambam`
5. Choose: `server` folder as root directory
6. Add MySQL database service
7. Set environment variables (see below)

## 🔧 Environment Variables

### Railway Backend Variables:
```
PORT=3001
DB_HOST=(Railway will provide)
DB_PORT=3306
DB_USER=root
DB_PASSWORD=(Railway will provide)
DB_NAME=fambam
JWT_SECRET=(generate random string)
NODE_ENV=production
```

### Vercel Frontend Variables:
```
REACT_APP_API_URL=https://your-railway-backend-url.railway.app
```

## 📱 After Deployment:
1. Update frontend API URL to point to Railway backend
2. Test all functionality
3. Set up custom domain (optional)

## 🔗 Live URLs:
- Frontend: https://your-app.vercel.app
- Backend: https://your-backend.railway.app
