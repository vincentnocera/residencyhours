"use client"

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function TestSetup() {
  const [status, setStatus] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `${new Date().toISOString()}: ${message}`])
  }

  const runTestSetup = async () => {
    setIsRunning(true)
    setStatus([])
    
    try {
      // 1. Create test user
      addStatus('Creating test user...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'nocera.vincent@gmail.com',
        password: 'testpassword123'
      })
      
      if (signUpError && !signUpError.message.includes('User already registered') && !signUpError.message.includes('Too Many Requests')) {
        addStatus(`Error creating user: ${signUpError.message}`)
      } else if (signUpError && signUpError.message.includes('Too Many Requests')) {
        addStatus('Rate limited - user likely already exists, trying to sign in...')
      } else {
        addStatus('Test user created or already exists')
      }

      // 2. Sign in
      addStatus('Signing in...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'nocera.vincent@gmail.com',
        password: 'testpassword123'
      })
      
      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          addStatus('⚠️ Email not confirmed. Check your email for a confirmation link, or try again in a few minutes.')
          addStatus('For development, you may need to disable email confirmation in Supabase settings.')
        } else {
          addStatus(`Error signing in: ${signInError.message}`)
        }
        return
      }
      
      addStatus(`Signed in successfully. User ID: ${signInData.user?.id}`)

      // 3. Create profile
      if (signInData.user) {
        addStatus('Creating user profile...')
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: signInData.user.id,
            email: signInData.user.email,
            first_name: 'Vincent',
            last_name: 'Nocera',
            role: 'resident',
            program_id: '550e8400-e29b-41d4-a716-446655440000'
          })
        
        if (profileError) {
          addStatus(`Error creating profile: ${profileError.message}`)
        } else {
          addStatus('Profile created successfully')
        }
      }

      // 4. Test queries
      addStatus('Testing activities query...')
      const { data: activities, error: activitiesError } = await supabase
        .from('activities')
        .select('*')
        .order('name')
      
      if (activitiesError) {
        addStatus(`Error fetching activities: ${activitiesError.message}`)
      } else {
        addStatus(`Found ${activities?.length || 0} activities`)
      }

      // 5. Test schedules query
      addStatus('Testing schedules query...')
      const { data: schedules, error: schedulesError } = await supabase
        .from('schedules')
        .select('*')
        .eq('user_id', signInData.user?.id)
      
      if (schedulesError) {
        addStatus(`Error fetching schedules: ${schedulesError.message}`)
      } else {
        addStatus(`Found ${schedules?.length || 0} schedules`)
      }

      addStatus('✅ Test setup complete!')
      
    } catch (error) {
      addStatus(`Unexpected error: ${error}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Test Setup Helper</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTestSetup} disabled={isRunning}>
          {isRunning ? 'Running...' : 'Run Test Setup'}
        </Button>
        
        {status.length > 0 && (
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {status.join('\n')}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 