# Feedback System - Supabase Migration Guide

## 🎯 Overview

This guide will help you migrate your feedback storage from ephemeral JSON files to persistent Supabase storage with optional Weaviate semantic search.

## ⚠️ The Problem We're Solving

**Production Issue:** Railway Docker containers are ephemeral. Every deployment/restart loses the `feedback_data.json` file. This is why your production feedback disappeared after a few days.

## ✅ The Solution

**Triple Redundancy Storage:**
1. **Supabase** (Primary) - Persistent database, survives deployments ✨
2. **Weaviate** (Optional) - Semantic search when available locally
3. **JSON** (Backup) - Local fallback for development

---

## 📋 Step-by-Step Setup

### Step 1: Create the Feedback Table in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and run the SQL from `backend/migrations/create_feedback_table.sql`

**What this creates:**
- `feedback` table with proper schema
- Indexes for performance (user_id, created_at, feature, status, feedback_type)
- Full-text search index on feedback_text
- Row Level Security (RLS) policies
- Auto-updating timestamps

**Verify it worked:**
```sql
-- Run this in Supabase SQL Editor
SELECT * FROM feedback LIMIT 1;
```

---

### Step 2: Migrate Existing Feedback

Once the table is created, migrate your 16 existing feedback entries:

```bash
cd backend
./venv/bin/python3 migrate_feedback_to_supabase.py
```

**Expected output:**
```
✅ MIGRATION SUCCESSFUL!
   Migrated: 16 entries
   Failed: 0 entries
   Total: 16 entries

🎉 All feedback is now stored in Supabase!
```

---

### Step 3: Test the System

Your feedback system now works with **automatic fallback:**

#### Storage Priority (writes):
1. ✅ **Supabase** (primary - must succeed in production)
2. ✅ **JSON** (backup - always writes locally)
3. ✅ **Weaviate** (optional - if running locally)

#### Search Priority (reads):
1. 🔍 **Weaviate** semantic search (if connected)
2. 📊 **Supabase** PostgreSQL full-text search
3. 📝 **JSON** simple text matching

**Test it:**
```bash
# In your backend directory with venv activated
python3 -c "from feedback_storage import feedback_storage; print(feedback_storage.get_feedback_summary())"
```

---

## 🚀 How It Works

### New Feedback Submission

```python
# User submits feedback via API
POST /feedback/general
{
  "feedback": "I love the roast curves feature!",
  "type": "feature"
}

# Backend stores to all available systems:
1. Supabase.insert() ✅  # Primary - production persistence
2. JSON.append() ✅      # Backup - local development
3. Weaviate.sync() ✅    # Optional - semantic search
```

### Searching Feedback

```python
# Search for "roast curves"
GET /admin/feedback/search?query=roast+curves

# System tries in order:
1. Weaviate semantic search → "roast curves", "analyzing roasts", "curve analysis"
2. Supabase full-text → PostgreSQL to_tsvector search
3. JSON text search → Simple keyword matching
```

---

## 🏗️ Database Schema

### feedback table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (e.g., feedback_user123_1234567890) |
| `user_id` | UUID | Foreign key to auth.users |
| `user_email` | TEXT | User's email address |
| `feedback_text` | TEXT | The actual feedback content |
| `feature` | TEXT | ai_copilot, general_app, etc. |
| `feedback_type` | TEXT | general, bug, feature, improvement |
| `status` | TEXT | new, reviewed, in_progress, resolved |
| `sentiment` | TEXT | positive, negative, neutral |
| `priority` | TEXT | low, medium, high, critical |
| `created_at` | TIMESTAMP | Auto-set on insert |
| `updated_at` | TIMESTAMP | Auto-updated on change |

---

## 🔍 Semantic Search Explained

### Without Semantic Search (text matching):
```
Query: "roast curves"
Finds: Only exact matches with "roast" AND "curves"
```

### With Semantic Search (Weaviate):
```
Query: "roast curves"
Finds:
  ✅ "i would like to understand and analyze roast curves"
  ✅ "need help analyzing my roasting profiles"
  ✅ "the temperature graph feature is confusing"
  ✅ "want to compare different roast progressions"
```

**How it works:**
- Converts text to vectors (embeddings)
- Finds similar meaning, not just exact words
- Better for understanding user intent

---

## 📊 Admin Endpoints

### View All Feedback
```bash
GET /admin/feedback
```

### Search Feedback
```bash
GET /admin/feedback/search?query=your+query
```

### Get Summary
```bash
GET /admin/feedback/summary

# Returns:
{
  "total_feedback": 16,
  "by_type": {
    "AI Copilot": 8,
    "General": 5,
    "Feature": 1,
    "Bug": 1,
    "Improvement": 1
  },
  "storage_status": {
    "supabase": "connected",
    "weaviate": "connected",
    "json": "available"
  }
}
```

### Migrate to Supabase (one-time)
```bash
POST /admin/feedback/migrate-to-supabase
```

### Migrate to Weaviate (optional, local dev)
```bash
POST /admin/feedback/migrate-to-weaviate
```

---

## 🔐 Security (Row Level Security)

The feedback table uses RLS policies:

1. **Users can insert their own feedback** ✅
2. **Users can view their own feedback** ✅
3. **Admins can view ALL feedback** ✅
4. **Admins can update feedback** ✅ (change status, etc.)

---

## 🌍 Environment Comparison

### Local Development
```
Storage: Supabase + JSON + Weaviate
Search: Weaviate (semantic) → Supabase → JSON
Status: All systems available
```

### Production (Railway)
```
Storage: Supabase + JSON (resets on deploy)
Search: Supabase (full-text) → JSON (if new deploy)
Status: Supabase is primary, JSON is temporary
```

---

## 🐛 Troubleshooting

### "Supabase not connected"
```bash
# Check environment variables
echo $SUPABASE_URL
echo $SUPABASE_SERVICE_ROLE_KEY

# Should be set in .env file locally
# Should be set in Railway environment variables for production
```

### "Feedback table doesn't exist"
```bash
# Run the SQL migration in Supabase SQL Editor
# File: backend/migrations/create_feedback_table.sql
```

### "Weaviate not available"
```bash
# This is OK! Weaviate is optional.
# In production, you'll use Supabase full-text search instead.

# To enable locally:
cd /path/to/roast-app
docker compose -f docker-compose.weaviate.yml up -d
```

---

## 🎯 Benefits

### ✅ Never Lose Production Data
- Supabase persists across deployments
- No more disappearing feedback

### ✅ Semantic Search (Local Dev)
- Find feedback by meaning, not just keywords
- Better understanding of user needs

### ✅ Triple Redundancy
- Supabase (primary)
- JSON (backup)
- Weaviate (optional)

### ✅ Graceful Degradation
- If Supabase fails → uses JSON
- If Weaviate unavailable → uses Supabase search
- System keeps working no matter what

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Create `feedback` table in Supabase
- [ ] Migrate existing feedback: `python3 migrate_feedback_to_supabase.py`
- [ ] Verify environment variables in Railway:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SUPABASE_JWT_SECRET`
- [ ] Deploy backend to Railway
- [ ] Test feedback submission in production
- [ ] Verify feedback persists after deployment

---

## 📝 Next Steps

1. **Run the SQL migration** in Supabase (Step 1 above)
2. **Migrate your 16 entries** to Supabase (Step 2 above)
3. **Test locally** to verify everything works
4. **Deploy to Railway** - feedback will now persist!

---

## 🆘 Need Help?

Check the logs:
```bash
# Local development
cd backend
./venv/bin/python3 -m uvicorn main:app --reload

# Watch for these log messages:
# ✅ Feedback storage: Supabase connected (persistent storage)
# ✅ Feedback storage: Weaviate connected (semantic search available)
# ✅ Stored feedback to Supabase: feedback_xxx
```

---

**Summary:** Your feedback will now persist forever in Supabase, with optional semantic search via Weaviate for local development, and JSON backup for extra safety. Production feedback will never disappear again! 🎉

