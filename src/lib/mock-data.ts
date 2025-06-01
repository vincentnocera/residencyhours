import { Activity, User, WeeklySchedule } from '@/types'
import { startOfWeek, addWeeks } from 'date-fns'

export const mockActivities: Activity[] = [
  { id: '1', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "CONT_CLINIC", display_name: "Continuity Clinic", color: "#3B82F6", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '2', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "INPT_PSYCH", display_name: "Inpatient Psych", color: "#8B5CF6", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "CONSULT", display_name: "Consult Service", color: "#10B981", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "NIGHT_FLOAT", display_name: "Night Float", color: "#F59E0B", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "CLINICAL_ELECTIVE", display_name: "Clinical Elective", color: "#EC4899", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "NON_CLINICAL_ELECTIVE", display_name: "Non-Clinical Elective", color: "#A78BFA", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "EDUCATION", display_name: "Didactics", color: "#EF4444", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "RESEARCH", display_name: "Research", color: "#6366F1", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '9', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "ADMIN", display_name: "Admin Time", color: "#64748B", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '10', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "VACATION", display_name: "Vacation", color: "#06B6D4", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '11', program_id: '550e8400-e29b-41d4-a716-446655440000', name: "SICK", display_name: "Sick Leave", color: "#F97316", is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
]

export const mockUser: User = {
  id: '1',
  first_name: 'John',
  last_name: 'Smith',
  email: 'john.smith@hospital.edu',
  role: 'resident',
  program_id: '550e8400-e29b-41d4-a716-446655440000',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockPDUser: User = {
  id: '2',
  first_name: 'Sarah',
  last_name: 'Johnson',
  email: 'sarah.johnson@hospital.edu',
  role: 'program_director',
  program_id: '550e8400-e29b-41d4-a716-446655440000',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export const mockResidents: User[] = [
  { id: '1', first_name: 'John', last_name: 'Smith', email: 'john.smith@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '3', first_name: 'Emily', last_name: 'Davis', email: 'emily.davis@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '4', first_name: 'Michael', last_name: 'Brown', email: 'michael.brown@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '5', first_name: 'Jessica', last_name: 'Wilson', email: 'jessica.wilson@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '6', first_name: 'David', last_name: 'Martinez', email: 'david.martinez@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '7', first_name: 'Lisa', last_name: 'Anderson', email: 'lisa.anderson@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '8', first_name: 'Robert', last_name: 'Taylor', email: 'robert.taylor@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: '9', first_name: 'Maria', last_name: 'Garcia', email: 'maria.garcia@hospital.edu', role: 'resident', program_id: '550e8400-e29b-41d4-a716-446655440000', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]

// Generate mock schedules for the past 4 weeks and next 2 weeks
const currentWeek = startOfWeek(new Date(), { weekStartsOn: 1 })

export const mockSchedules: WeeklySchedule[] = []

for (let weekOffset = -4; weekOffset <= 2; weekOffset++) {
  const weekStart = addWeeks(currentWeek, weekOffset)
  
  mockResidents.forEach(resident => {
    let status: 'draft' | 'submitted' | 'approved' = 'draft'
    
    // Past weeks are mostly submitted or approved
    if (weekOffset < 0) {
      const random = Math.random()
      if (random < 0.7) status = 'approved'
      else if (random < 0.9) status = 'submitted'
    }
    // Current week is mostly submitted
    else if (weekOffset === 0) {
      if (Math.random() < 0.8) status = 'submitted'
    }
    
    mockSchedules.push({
      id: `schedule-${resident.id}-${weekOffset}`,
      user_id: resident.id,
      week_start_date: weekStart.toISOString(),
      status,
      submitted_at: status !== 'draft' ? new Date().toISOString() : undefined,
      approved_at: status === 'approved' ? new Date().toISOString() : undefined,
      approved_by: status === 'approved' ? mockPDUser.id : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })
}