# Authentication Setup Guide

This guide will help you set up Supabase Auth with Google, GitHub, and email/password sign-in for your Roast Buddy application.

## 1. Supabase Configuration

### Enable Google OAuth Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **Google** provider
4. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Set **Redirect URL** to: `https://your-project-id.supabase.co/auth/v1/callback`

### Enable GitHub OAuth Provider

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Providers**
3. Enable **GitHub** provider
4. Add your GitHub OAuth credentials:
   - **Client ID**: From GitHub OAuth App
   - **Client Secret**: From GitHub OAuth App
5. The callback URL will auto-populate: `https://your-project-id.supabase.co/auth/v1/callback`

### Enable Email/Password Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Settings**
3. Under **Auth Providers**, ensure **Email** is enabled (it's enabled by default)
4. Configure email settings:
   - **Enable email confirmations**: Turn OFF for instant signup (recommended for better UX)
   - **Enable email change confirmations**: Optional
   - **Enable phone confirmations**: Optional

### Get Required Keys

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (for `SUPABASE_URL`)
   - **anon public** key (for `VITE_SUPABASE_ANON_KEY`)
   - **service_role** key (for `SUPABASE_SERVICE_ROLE_KEY`)
   - **JWT Secret** (for `SUPABASE_JWT_SECRET`)

## 2. Environment Variables

### Frontend (.env file in frontend directory)
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### Backend (.env file in backend directory)
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

## 3. Database Schema Updates

You need to add a `user_id` column to your `roast_entries` table:

```sql
-- Add user_id column to roast_entries table
ALTER TABLE roast_entries ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_roast_entries_user_id ON roast_entries(user_id);

-- Add RLS (Row Level Security) policy
ALTER TABLE roast_entries ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own roasts
CREATE POLICY "Users can view own roasts" ON roast_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roasts" ON roast_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roasts" ON roast_entries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roasts" ON roast_entries
  FOR DELETE USING (auth.uid() = user_id);
```

## 4. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client IDs**
5. Set **Application type** to **Web application**
6. Add **Authorized redirect URIs**:
   - `https://your-project-id.supabase.co/auth/v1/callback`
   - `http://localhost:5173` (for development)
7. Copy **Client ID** and **Client Secret** to Supabase

## 5. GitHub OAuth App Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the details:
   - **Application name**: "Roast Buddy"
   - **Homepage URL**: `https://roastbuddy.app` (or your domain)
   - **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback`
4. Click **Register application**
5. Copy **Client ID** and **Client Secret** to Supabase

## 6. Testing

1. Start your frontend: `cd frontend && npm run dev`
2. Start your backend: `cd backend && uvicorn main:app --reload`
3. Visit `http://localhost:5173`
4. Test all authentication methods:
   - **Email/Password**: Enter email and password to sign in or sign up
   - **Google OAuth**: Click "Continue with Google"
   - **GitHub OAuth**: Click "Continue with GitHub"
5. Verify that roasts are now user-specific

## 7. Deployment

### Frontend (Vercel)
Add environment variables in Vercel dashboard:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Backend (Railway)
Add environment variables in Railway dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_JWT_SECRET`

## 8. Troubleshooting

- **"Invalid token" errors**: Check that `SUPABASE_JWT_SECRET` matches your Supabase project
- **CORS errors**: Ensure your frontend URL is in the allowed origins
- **Google OAuth errors**: Verify redirect URLs match exactly
- **GitHub OAuth errors**: Verify callback URL matches exactly
- **Database errors**: Ensure RLS policies are properly set up
