import { supabase } from '@/lib/supabase'
import type { Activity } from '@/types/database'

export async function getActivities(): Promise<Activity[]> {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching activities:', error)
    throw error
  }

  return data || []
} 