export interface User {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'admin' | 'program_director' | 'resident'
  program_id: string | null
  created_at: string
  updated_at: string
}

export interface Activity {
  id: string
  program_id: string
  name: string
  display_name: string
  color: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TimeBlock {
  id: string
  schedule_id: string
  activity_id: string
  date: string
  start_hour: number
  duration: number
  created_at: string
  updated_at: string
}

export interface WeekSchedule {
  id: string
  user_id: string
  week_start_date: string
  status: 'draft' | 'submitted' | 'approved'
  submitted_at?: string
  approved_at?: string
  approved_by?: string
  created_at: string
  updated_at: string
} 