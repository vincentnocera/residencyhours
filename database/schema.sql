-- Enable Row Level Security
ALTER DEFAULT PRIVILEGES GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- Programs table (create first since profiles references it)
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('resident', 'program_director', 'admin')) DEFAULT 'resident',
  program_id UUID REFERENCES public.programs(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activities table
CREATE TABLE public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES public.programs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedules table (represents a week's schedule)
CREATE TABLE public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'approved')) DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, week_start_date)
);

-- Time blocks table
CREATE TABLE public.time_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID REFERENCES public.schedules(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_hour DECIMAL(3,1) NOT NULL CHECK (start_hour >= 0 AND start_hour < 24),
  duration DECIMAL(3,1) NOT NULL CHECK (duration > 0 AND duration <= 24),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Schedules policies
CREATE POLICY "Users can view their own schedules" ON public.schedules FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own schedules" ON public.schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own draft/submitted schedules" ON public.schedules FOR UPDATE USING (
  auth.uid() = user_id AND status IN ('draft', 'submitted')
);

-- Time blocks policies  
CREATE POLICY "Users can view their own time blocks" ON public.time_blocks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.schedules WHERE schedules.id = time_blocks.schedule_id AND schedules.user_id = auth.uid())
);
CREATE POLICY "Users can manage their own time blocks" ON public.time_blocks FOR ALL USING (
  EXISTS (SELECT 1 FROM public.schedules WHERE schedules.id = time_blocks.schedule_id AND schedules.user_id = auth.uid())
);

-- Activities policies (everyone can read, only admins can modify)
CREATE POLICY "Everyone can view activities" ON public.activities FOR SELECT TO authenticated USING (true);

-- Programs policies (everyone can read, only admins can modify)
CREATE POLICY "Everyone can view programs" ON public.programs FOR SELECT TO authenticated USING (true);

-- Admin policies for activities
CREATE POLICY "Admins can insert activities" ON public.activities FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update activities" ON public.activities FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can delete activities" ON public.activities FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Program director policies for activities (can manage activities in their program)
CREATE POLICY "Program directors can insert activities in their program" ON public.activities FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'program_director' 
    AND profiles.program_id = activities.program_id
  )
);
CREATE POLICY "Program directors can update activities in their program" ON public.activities FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'program_director' 
    AND profiles.program_id = activities.program_id
  )
);
CREATE POLICY "Program directors can delete activities in their program" ON public.activities FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'program_director' 
    AND profiles.program_id = activities.program_id
  )
);

-- Admin policies for programs
CREATE POLICY "Admins can insert programs" ON public.programs FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can update programs" ON public.programs FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Admins can delete programs" ON public.programs FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Additional profile policies for admins and program directors
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);
CREATE POLICY "Program directors can view profiles in their program" ON public.profiles FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles pd
    WHERE pd.id = auth.uid() 
    AND pd.role = 'program_director' 
    AND pd.program_id = profiles.program_id
  )
);

-- Additional schedule policies for program directors
CREATE POLICY "Program directors can view schedules in their program" ON public.schedules FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles pd
    JOIN public.profiles resident ON resident.id = schedules.user_id
    WHERE pd.id = auth.uid() 
    AND pd.role = 'program_director' 
    AND pd.program_id = resident.program_id
  )
);
CREATE POLICY "Program directors can approve schedules in their program" ON public.schedules FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles pd
    JOIN public.profiles resident ON resident.id = schedules.user_id
    WHERE pd.id = auth.uid() 
    AND pd.role = 'program_director' 
    AND pd.program_id = resident.program_id
  )
) WITH CHECK (
  -- Only allow updates that set approved_by to the current user
  approved_by = auth.uid() OR approved_by IS NULL
);

-- Admin policies for schedules
CREATE POLICY "Admins can view all schedules" ON public.schedules FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- Insert some sample data
INSERT INTO public.programs (id, name, description) VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Internal Medicine', 'Internal Medicine Residency Program');

INSERT INTO public.activities (id, program_id, name, display_name, color) VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'clinical_care', 'Patient Care', '#3B82F6'),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'surgery', 'Surgery', '#EF4444'),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'education', 'Education', '#10B981'),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'research', 'Research', '#8B5CF6'),
  ('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440000', 'admin', 'Administrative', '#F59E0B'); 