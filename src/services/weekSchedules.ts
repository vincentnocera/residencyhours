import { supabase } from '@/lib/supabase'
import type { WeekSchedule } from '@/types/database'
import { format } from 'date-fns'

export async function getWeekSchedule(userId: string, weekStart: Date): Promise<WeekSchedule | null> {
  const weekDate = format(weekStart, 'yyyy-MM-dd')
  
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .eq('week_start_date', weekDate)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found - this is okay, just means no schedule exists yet
      return null
    }
    console.error('Error fetching week schedule:', error)
    throw error
  }

  return data
}

export async function createOrUpdateWeekSchedule(
  userIdParam: string | null, 
  weekStart: Date, 
  status: 'draft' | 'submitted' | 'approved'
): Promise<WeekSchedule> {
  const weekDate = format(weekStart, 'yyyy-MM-dd')
  
  // Ensure we use the authenticated user's ID to satisfy RLS policies
  const { data: authUserData } = await supabase.auth.getUser()
  const userId = authUserData?.user?.id || userIdParam

  const scheduleData: Partial<WeekSchedule> = {
    user_id: userId!,
    week_start_date: weekDate,
    status: status
  }

  if (status === 'submitted') {
    scheduleData.submitted_at = new Date().toISOString()
  }

  console.log('Creating/updating schedule with data:', { userId, weekDate, scheduleData })

  const { data, error } = await supabase
    .from('schedules')
    .upsert(scheduleData, {
      onConflict: 'user_id,week_start_date'
    })
    .select()
    .single()

  if (error) {
    console.error('Error updating week schedule:', error.message, error.details, error.hint)
    throw error
  }

  return data
}

export async function approveWeekSchedule(
  scheduleId: string,
  approverId: string
): Promise<WeekSchedule> {
  const { data, error } = await supabase
    .from('schedules')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: approverId
    })
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) {
    console.error('Error approving week schedule:', error)
    throw error
  }

  return data
}

export async function getAllWeekSchedulesForUser(userId: string): Promise<WeekSchedule[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('user_id', userId)
    .order('week_start_date', { ascending: false })

  if (error) {
    console.error('Error fetching all week schedules:', error)
    throw error
  }

  return data || []
} 