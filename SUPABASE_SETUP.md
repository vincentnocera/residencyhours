# Supabase Setup Guide

## 1. Create Environment Variables

Create a file named `.env.local` in the root of the residencyhours directory with the following content:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following:
   - **Project URL**: This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon/Public Key**: This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 3. Initial Database Setup

Run this SQL in your Supabase SQL editor to create test data:

```sql
-- Insert test user
INSERT INTO users (id, email, name, role) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'resident@example.com', 'Test Resident', 'resident')
ON CONFLICT (id) DO NOTHING;

-- Insert sample activities
INSERT INTO activities (name, category, color_class, description) VALUES
('Morning Report', 'Clinical', 'bg-blue-100 text-blue-800', 'Daily morning report and case discussions'),
('Clinic', 'Clinical', 'bg-green-100 text-green-800', 'Outpatient clinic hours'),
('OR Time', 'Clinical', 'bg-purple-100 text-purple-800', 'Operating room procedures'),
('Ward Rounds', 'Clinical', 'bg-indigo-100 text-indigo-800', 'Inpatient ward rounds'),
('Emergency', 'Clinical', 'bg-red-100 text-red-800', 'Emergency department coverage'),
('Research', 'Academic', 'bg-yellow-100 text-yellow-800', 'Research activities and data collection'),
('Study Time', 'Academic', 'bg-orange-100 text-orange-800', 'Self-directed study and exam preparation'),
('Conference', 'Academic', 'bg-pink-100 text-pink-800', 'Academic conferences and presentations'),
('Admin', 'Administrative', 'bg-gray-100 text-gray-800', 'Administrative tasks and paperwork'),
('Call', 'On-Call', 'bg-rose-100 text-rose-800', 'On-call duties'),
('Teaching', 'Education', 'bg-teal-100 text-teal-800', 'Teaching medical students or juniors'),
('Meeting', 'Administrative', 'bg-slate-100 text-slate-800', 'Department meetings and committees')
ON CONFLICT DO NOTHING;
```

## 4. Test the Connection

After setting up your environment variables, restart the development server:

```bash
npm run dev
```

The application should now be connected to your Supabase database! 