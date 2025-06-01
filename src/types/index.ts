// Re-export database types
export type { User, Activity, TimeBlock, WeekSchedule } from './database'

// Additional type aliases for compatibility
export type UserRole = 'admin' | 'program_director' | 'resident'
export type ScheduleStatus = 'draft' | 'submitted' | 'approved'

// Legacy type mappings (these should be gradually removed)
export type WeeklySchedule = import('./database').WeekSchedule

// Types not in database.ts but used in components
export interface TimeEntry {
  id: string
  scheduleId: string
  date: Date
  activityId: string
  hours: number
  notes?: string
}

export interface Template {
  id: string
  userId: string
  name: string
  isDefault: boolean
  createdAt: Date
}

export interface TemplateEntry {
  id: string
  templateId: string
  dayOfWeek: number // 0-6 (Monday-Sunday)
  activityId: string
  hours: number
}