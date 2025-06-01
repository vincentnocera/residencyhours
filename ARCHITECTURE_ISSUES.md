# Architectural Issues and Solutions

## Current Problems

### 1. **Environment Variables Not Set**
The most immediate issue is that your Supabase environment variables are not configured. This is why the activities dropdown is empty.

**Solution:**
Create a `.env.local` file in the `residencyhours` directory with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. **Mock Data vs Real Data**
The dashboard is still using `mockUser` instead of fetching the actual authenticated user.

**Files affected:**
- `src/app/dashboard/page.tsx` - uses `mockUser`
- `src/lib/mock-data.ts` - defines mock activities with wrong schema
- `src/types/index.ts` vs `src/types/database.ts` - conflicting type definitions

**Solution:**
- Remove dependency on mock data
- Fetch current user on dashboard load
- Use consistent type definitions from `database.ts`

### 3. **No Activities in Database**
Even after fixing environment variables, you need to seed the activities table.

**Solution:**
Create a seed script to populate activities:
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
('Sick Leave', 'Time Off', 'bg-orange-600', 'Sick leave');
```

### 4. **Lack of Error Handling**
Components don't handle loading states or errors properly.

**Solution:**
- Add loading states to all data fetching
- Add error boundaries
- Show user-friendly error messages

### 5. **No Central State Management**
Each component fetches its own data independently.

**Solution:**
- Consider using React Context or a state management library
- Create a UserContext to share user data
- Cache activities and other reference data

## Recommended Architecture Improvements

### 1. **Create a Layout with Authentication**
```typescript
// src/app/dashboard/layout.tsx
export default async function DashboardLayout({ children }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  
  return (
    <UserProvider user={user}>
      {children}
    </UserProvider>
  )
}
```

### 2. **Use Server Components for Data Fetching**
```typescript
// src/app/dashboard/page.tsx
export default async function DashboardPage() {
  const user = await getCurrentUser()
  const activities = await getActivities()
  
  return <DashboardClient user={user} activities={activities} />
}
```

### 3. **Create Proper Type Guards**
```typescript
// src/lib/type-guards.ts
export function isActivity(obj: any): obj is Activity {
  return obj && 
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.category === 'string'
}
```

### 4. **Add Proper Error Boundaries**
```typescript
// src/components/error-boundary.tsx
export function ErrorBoundary({ children, fallback }) {
  // Implementation
}
```

## Next Steps

1. **Create `.env.local` with your Supabase credentials**
2. **Run the seed script to populate activities**
3. **Replace mock data usage with real data fetching**
4. **Add proper error handling and loading states**
5. **Consider implementing central state management** 