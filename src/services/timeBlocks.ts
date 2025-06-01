import { supabase } from '@/lib/supabase'
import type { TimeBlock } from '@/types/database'
import { format, addDays, startOfWeek } from 'date-fns'
import { getWeekSchedule, createOrUpdateWeekSchedule } from './weekSchedules'

// Type for the input blocks in batchSaveTimeBlocks
export interface BlockInput {
  activityId: string
  startTime: string  // Format: "HH:MM"
  duration: number
}

export async function getTimeBlocksForWeek(userId: string, weekStart: Date): Promise<TimeBlock[]> {
  // First, get or create the week schedule
  let schedule = await getWeekSchedule(userId, weekStart)
  
  if (!schedule) {
    // Create a draft schedule if none exists
    schedule = await createOrUpdateWeekSchedule(userId, weekStart, 'draft')
  }

  // Now get time blocks for this schedule
  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('schedule_id', schedule.id)
    .order('date', { ascending: true })
    .order('start_hour', { ascending: true })

  if (error) {
    console.error('Error fetching time blocks:', error)
    throw error
  }

  return data || []
}

export async function getTimeBlocksForScheduleId(scheduleId: string): Promise<TimeBlock[]> {
  const { data, error } = await supabase
    .from('time_blocks')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('date', { ascending: true })
    .order('start_hour', { ascending: true })

  if (error) {
    console.error('Error fetching time blocks for schedule ID:', error)
    throw error
  }

  return data || []
}

export async function saveTimeBlock(block: Partial<TimeBlock>): Promise<TimeBlock> {
  const { data, error } = await supabase
    .from('time_blocks')
    .upsert(block)
    .select()
    .single()

  if (error) {
    console.error('Error saving time block:', error)
    throw error
  }

  return data
}

export async function deleteTimeBlock(blockId: string): Promise<void> {
  const { error } = await supabase
    .from('time_blocks')
    .delete()
    .eq('id', blockId)

  if (error) {
    console.error('Error deleting time block:', error)
    throw error
  }
}

export async function batchSaveTimeBlocks(userId: string, weekStart: Date, blocks: Record<string, BlockInput[]>): Promise<void> {
  // First, get or create the week schedule
  let schedule = await getWeekSchedule(userId, weekStart)
  
  if (!schedule) {
    // Create a draft schedule if none exists
    schedule = await createOrUpdateWeekSchedule(userId, weekStart, 'draft')
  }

  // Delete all existing blocks for this schedule
  const { error: deleteError } = await supabase
    .from('time_blocks')
    .delete()
    .eq('schedule_id', schedule.id)

  if (deleteError) {
    console.error('Error deleting existing time blocks:', deleteError)
    throw deleteError
  }

  // Prepare blocks for insertion
  const blocksToInsert: Partial<TimeBlock>[] = []
  
  Object.entries(blocks).forEach(([dayDate, dayBlocks]) => {
    dayBlocks.forEach(block => {
      // Convert start time (e.g., "09:30") to hour decimal (e.g., 9.5)
      const [startHour, startMinute] = block.startTime.split(':').map(Number)
      const startHourDecimal = startHour + (startMinute / 60)

      blocksToInsert.push({
        schedule_id: schedule.id,
        activity_id: block.activityId,
        date: dayDate,
        start_hour: startHourDecimal,
        duration: block.duration
      })
    })
  })

  // Insert new blocks if any
  if (blocksToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('time_blocks')
      .insert(blocksToInsert)

    if (insertError) {
      console.error('Error inserting time blocks:', insertError)
      throw insertError
    }
  }
} 