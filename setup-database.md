# Database Setup Instructions

## Step 1: Set up the Database Schema

1. Open your Supabase project dashboard: https://hugetmriozbibtmpafrk.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Copy and paste the entire contents of `database/schema.sql` into the SQL editor
4. Click **Run** to execute the schema

## Step 2: Verify Tables Were Created

After running the schema, you should see these tables in your **Table Editor**:
- `programs`
- `profiles` 
- `activities`
- `schedules`
- `time_blocks`

## Step 3: Test the Application

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open your browser to http://localhost:3000/dashboard

3. The application should now load without authentication errors!

## What the Schema Does

- Creates all necessary tables with proper relationships
- Sets up Row Level Security (RLS) policies
- Adds sample program and activity data
- Configures authentication integration with Supabase Auth

## Troubleshooting

If you still see auth errors, check the browser console for more details. The app will use a mock user for testing until you implement full Supabase authentication. 