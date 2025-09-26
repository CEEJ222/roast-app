# Vercel Backend Deployment Guide

## Why Vercel?

Railway has persistent CORS issues with OPTIONS requests (502 errors). Vercel has excellent CORS support and is more reliable for FastAPI applications.

## Deployment Steps

### 1. Create Vercel Account
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub account

### 2. Deploy Backend
1. Click "New Project" in Vercel dashboard
2. Import your GitHub repository (`CEEJ222/roast-app`)
3. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Output Directory**: Leave empty
   - **Install Command**: `pip install -r requirements.txt`

### 3. Environment Variables
Add these environment variables in Vercel dashboard:
- `SUPABASE_URL` (from Railway)
- `SUPABASE_SERVICE_ROLE_KEY` (from Railway)
- `SUPABASE_JWT_SECRET` (from Railway)

### 4. Deploy
1. Click "Deploy"
2. Wait for deployment to complete
3. Note the new backend URL (e.g., `https://roast-app-backend.vercel.app`)

### 5. Update Frontend
Update your frontend to use the new Vercel backend URL instead of Railway.

## Files Created for Vercel

- `vercel.json` - Vercel configuration
- `backend/vercel_main.py` - Vercel-optimized FastAPI app
- `backend/requirements.txt` - Python dependencies

## Benefits of Vercel

- ✅ Excellent CORS support
- ✅ No 502 errors on OPTIONS requests
- ✅ Better reliability than Railway
- ✅ Easy environment variable management
- ✅ Automatic deployments from GitHub
- ✅ Better logging and monitoring

## Next Steps

1. Deploy to Vercel using the steps above
2. Update frontend API calls to use new Vercel URL
3. Test the application
4. Remove Railway deployment once confirmed working
