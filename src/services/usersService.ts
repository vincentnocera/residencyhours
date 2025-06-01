import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'

/**
 * Fetches users by their role, optionally filtered by program ID.
 * @param role The role to filter by (e.g., 'resident', 'program_director').
 * @param programId Optional program ID to filter users by.
 * @returns A promise that resolves to an array of User objects.
 */
export async function getUsersByRoleAndProgram(
  role: User['role'],
  programId?: string
): Promise<User[]> {
  let query = supabase.from('profiles').select('*').eq('role', role)

  if (programId) {
    query = query.eq('program_id', programId)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error fetching users with role ${role}${programId ? ` and program ${programId}` : ''}:`, error)
    throw error
  }

  return data || []
} 