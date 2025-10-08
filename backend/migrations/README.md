# Database Migrations

This directory contains SQL migrations for the Roast Buddy application.

## Applying Migrations

### Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of the migration file
4. Execute the SQL

### Using the migration script
```bash
cd backend
python3 run_migration.py migrations/create_feedback_table.sql
```

## Migrations

### `create_feedback_table.sql`
Creates the `feedback` table for persistent storage of user feedback.

**What it does:**
- Creates `feedback` table with proper schema
- Adds indexes for performance
- Enables Row Level Security (RLS)
- Creates policies for user and admin access
- Adds full-text search capability

**Run this when:**
- Setting up the database for the first time
- After updating from JSON-only feedback storage

**Safe to run multiple times:** Yes (uses `IF NOT EXISTS`)

