# Quick Fix Guide

## Immediate Steps to Fix the Activities Dropdown

### 1. Create Environment Variables
Create a file named `.env.local` in the `residencyhours` directory:

```bash
cd residencyhours
touch .env.local
```

Add your Supabase credentials to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these in your Supabase project settings under Settings > API.

### 2. Seed the Activities Table
Run this SQL in your Supabase SQL editor:

```sql
INSERT INTO activities (name, category, color_class, description) VALUES
('Continuity Clinic', 'Clinical', 'bg-blue-500', 'Regular outpatient clinic'),
('Inpatient Psych', 'Clinical', 'bg-purple-500', 'Inpatient psychiatric unit'),
('Consult Service', 'Clinical', 'bg-green-500', 'Consultation-liaison service'),
('Night Float', 'Clinical', 'bg-orange-500', 'Overnight coverage'),
('Clinical Elective', 'Clinical', 'bg-pink-500', 'Clinical elective rotation'),
('Non-Clinical Elective', 'Education', 'bg-indigo-500', 'Non-clinical elective'),
('Didactics', 'Education', 'bg-red-500', 'Educational sessions'),
('Research', 'Academic', 'bg-blue-600', 'Research activities'),
('Admin Time', 'Administrative', 'bg-gray-500', 'Administrative duties'),
('Vacation', 'Time Off', 'bg-teal-500', 'Vacation time'),
('Sick Leave', 'Time Off', 'bg-orange-600', 'Sick leave')
ON CONFLICT (name) DO NOTHING;
```

### 3. Restart Your Development Server
```bash
npm run dev
```

### 4. Clear Browser Cache
Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

## Still Not Working?

Check the browser console for errors. Common issues:
- CORS errors: Check your Supabase URL is correct
- 401 errors: Check your anon key is correct
- Table not found: Ensure your database schema is set up correctly

## Next Steps
See `ARCHITECTURE_ISSUES.md` for long-term fixes to prevent these issues. 