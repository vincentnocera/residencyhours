import { supabase } from '@/lib/supabase'
import type { User } from '@/types/database'

// For testing purposes - this matches the test user in database/test-data.sql
export const MOCK_USER_ID = '123e4567-e89b-12d3-a456-426614174000'

// Test user credentials
export const TEST_USER_EMAIL = 'nocera.vincent@gmail.com'
export const TEST_USER_PASSWORD = 'testpassword123'

export async function signInTestUser() {
  try {
    // Try to sign in with test user
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD
    })
    
    if (error) {
      console.log('Test user not found, creating...')
      // If sign in fails, create the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_USER_EMAIL,
        password: TEST_USER_PASSWORD
      })
      
      if (signUpError) {
        console.error('Error creating test user:', signUpError)
        return null
      }
      
      return signUpData.user
    }
    
    return data.user
  } catch (error) {
    console.error('Error in signInTestUser:', error)
    return null
  }
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // First, try to get the current authenticated user
    const { data: authUser, error: authError } = await supabase.auth.getUser()
    
    if (authError || !authUser.user) {
      console.log('No authenticated user found')
      return null
    }

    console.log('Found authenticated user:', authUser.user.id, authUser.user.email)

    // Get the user profile from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.user.id)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      // If profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authUser.user.id,
          email: authUser.user.email || TEST_USER_EMAIL,
          first_name: 'Vincent',
          last_name: 'Nocera',
          role: 'resident',
          program_id: '550e8400-e29b-41d4-a716-446655440000' // Default program ID from schema
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating user profile:', createError)
        return null
      }
      
      return {
        id: newProfile.id,
        email: newProfile.email,
        first_name: newProfile.first_name,
        last_name: newProfile.last_name,
        role: newProfile.role,
        program_id: newProfile.program_id,
        created_at: newProfile.created_at,
        updated_at: newProfile.updated_at
      }
    }

    return {
      id: data.id,
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      role: data.role,
      program_id: data.program_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
} 