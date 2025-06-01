"use client"

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { startOfWeek, endOfWeek, isAfter, isBefore, addWeeks, addDays, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { WeekCalendar, type TimeBlock as WeekCalendarTimeBlock } from '@/components/hours/week-calendar'
import { WeekSelector } from '@/components/hours/week-selector'
import { Copy, Save, Send, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { getCurrentUser } from '@/services/auth'
import { getWeekSchedule, createOrUpdateWeekSchedule, approveWeekSchedule } from '@/services/weekSchedules'
import { getTimeBlocksForWeek, batchSaveTimeBlocks, type BlockInput as ServiceBlockInput, getTimeBlocksForScheduleId } from '@/services/timeBlocks'
import type { User, WeekSchedule } from '@/types/database'
// import { TestSetup } from './test-setup' // Keep for now, can be conditionally rendered if needed

type ScheduleStatus = 'draft' | 'submitted' | 'approved'

export default function DashboardPage() {
  const [currentWeek, setCurrentWeek] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  const [user, setUser] = useState<User | null>(null)
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule | null>(null)
  const [weekBlocks, setWeekBlocks] = useState<Record<string, WeekCalendarTimeBlock[]>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [isLoadingUser, setIsLoadingUser] = useState(true) // For initial user load
  const [isLoadingWeekData, setIsLoadingWeekData] = useState(false) // For week-specific data
  const [hasUnassignedBlocks, setHasUnassignedBlocks] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const [isCopying, setIsCopying] = useState(false)
  
  const scheduleStatus: ScheduleStatus = useMemo(() => weekSchedule?.status || 'draft', [weekSchedule])
  
  const today = new Date()
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 })
  const isAfterWeekEnd = isAfter(today, weekEnd)
  const isPastWeek = isBefore(currentWeek, currentWeekStart)
  const isEditable = !isAfterWeekEnd && (scheduleStatus !== 'approved' || (user?.role !== 'resident'))

  useEffect(() => {
    async function fetchUser() {
      setIsLoadingUser(true)
      try {
        const userData = await getCurrentUser()
        setUser(userData)
      } catch (error) {
        console.error('Error fetching user:', error)
        setUser(null) // Ensure user is null on error
      } finally {
        setIsLoadingUser(false)
      }
    }
    fetchUser()
  }, [])

  useEffect(() => {
    if (!user) {
      // If no user, clear week data or set to a default empty state
      setWeekSchedule(null)
      setWeekBlocks({})
      return
    }
    async function fetchWeekData() {
      setIsLoadingWeekData(true)
      try {
        const schedule = await getWeekSchedule(user!.id, currentWeek)
        setWeekSchedule(schedule)
        const dbTimeBlocks = await getTimeBlocksForWeek(user!.id, currentWeek)
        const blocksByDate: Record<string, WeekCalendarTimeBlock[]> = {}
        dbTimeBlocks.forEach(block => {
          const dateKey = block.date // Assuming block.date is already yyyy-MM-dd from service
          if (!blocksByDate[dateKey]) {
            blocksByDate[dateKey] = []
          }
          const hours = Math.floor(block.start_hour)
          const minutes = Math.round((block.start_hour - hours) * 60)
          const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
          const endHourDecimal = block.start_hour + block.duration
          const endHours = Math.floor(endHourDecimal)
          const endMinutes = Math.round((endHourDecimal - endHours) * 60)
          const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
          blocksByDate[dateKey].push({
            id: block.id,
            activityId: block.activity_id, // activity_id from db maps to activityId
            startTime: startTime,
            endTime: endTime,
            duration: block.duration
          })
        })
        setWeekBlocks(blocksByDate)
      } catch (error) {
        console.error('Error fetching week data:', error)
        setWeekSchedule(null) // Clear schedule on error
        setWeekBlocks({})     // Clear blocks on error
      } finally {
        setIsLoadingWeekData(false)
      }
    }
    fetchWeekData()
  }, [user, currentWeek])

  const prepareBlocksForService = (currentWeekBlocks: Record<string, WeekCalendarTimeBlock[]>): Record<string, ServiceBlockInput[]> => {
    const serviceReadyBlocks: Record<string, ServiceBlockInput[]> = {}
    for (const dateKey in currentWeekBlocks) {
      serviceReadyBlocks[dateKey] = currentWeekBlocks[dateKey]
        .filter(block => block.activityId !== null) // Ensure activityId is not null
        .map(block => ({
          activityId: block.activityId!,
          startTime: block.startTime,
          duration: block.duration,
        }))
    }
    return serviceReadyBlocks
  }

  const handleSubmit = useCallback(async () => {
    if (!user || hasUnassignedBlocks) return
    setIsSaving(true)
    try {
      const serviceBlocks = prepareBlocksForService(weekBlocks)
      await batchSaveTimeBlocks(user.id, currentWeek, serviceBlocks)
      const updatedSchedule = await createOrUpdateWeekSchedule(user.id, currentWeek, 'submitted')
      setWeekSchedule(updatedSchedule)
    } catch (error) {
      console.error('Error submitting schedule:', error)
    } finally {
      setIsSaving(false)
    }
  }, [user, currentWeek, weekBlocks, hasUnassignedBlocks])

  const handleSaveDraft = useCallback(async () => {
    if (!user) return // No need to check hasUnassignedBlocks for draft
    setIsSaving(true)
    try {
      const serviceBlocks = prepareBlocksForService(weekBlocks)
      await batchSaveTimeBlocks(user.id, currentWeek, serviceBlocks)
      const updatedSchedule = await createOrUpdateWeekSchedule(user.id, currentWeek, 'draft')
      setWeekSchedule(updatedSchedule)
    } catch (error) {
      console.error('Error saving draft:', error)
    } finally {
      setIsSaving(false)
    }
  }, [user, currentWeek, weekBlocks])

  const handleApprove = useCallback(async () => {
    if (!user || !weekSchedule) return
    setIsSaving(true)
    try {
      const updatedSchedule = await approveWeekSchedule(weekSchedule.id, user.id)
      setWeekSchedule(updatedSchedule)
    } catch (error) {
      console.error('Error approving schedule:', error)
    } finally {
      setIsSaving(false)
    }
  }, [user, weekSchedule])

  const handleCopyLastWeek = useCallback(async () => {
    if (!user || isCopying) return
    
    setIsCopying(true)
    setCopyError(null)
    setCopySuccess(false)
    
    const previousWeek = addWeeks(currentWeek, -1)
    
    try {
      // Step 1: Get the previous week's schedule
      const prevWeekSchedule = await getWeekSchedule(user.id, previousWeek)

      // Step 2: Check its status (Option A: Strict - only 'submitted' or 'approved')
      if (!prevWeekSchedule) {
        setCopyError('No schedule found for last week.')
        setIsCopying(false)
        return
      }

      if (prevWeekSchedule.status !== 'submitted' && prevWeekSchedule.status !== 'approved') {
        setCopyError(`Last week's schedule is a '${prevWeekSchedule.status}'. Only 'submitted' or 'approved' schedules can be copied.`)
        setIsCopying(false)
        return
      }

      // Step 3: Get time blocks for that specific schedule ID
      const prevDbTimeBlocks = await getTimeBlocksForScheduleId(prevWeekSchedule.id)
      
      if (prevDbTimeBlocks.length === 0) {
        setCopyError('No time blocks found in the last submitted/approved schedule.')
        setIsCopying(false) // Also set isCopying to false here
        return
      }
      
      // Copy the blocks
      const copiedBlocks: Record<string, WeekCalendarTimeBlock[]> = {}
      prevDbTimeBlocks.forEach((block, index) => {
        const prevWeekStartDate = startOfWeek(previousWeek, { weekStartsOn: 1 })
        // Ensure block.date is treated as UTC to avoid timezone issues with date-fns parsing
        const blockDateParts = block.date.split('-').map(Number)
        const blockDate = new Date(Date.UTC(blockDateParts[0], blockDateParts[1] - 1, blockDateParts[2]))
        
        const dayOffset = Math.floor((blockDate.getTime() - prevWeekStartDate.getTime()) / (1000 * 60 * 60 * 24))
        const newDate = addDays(currentWeek, dayOffset)
        const newDateKey = format(newDate, 'yyyy-MM-dd')
        
        if (!copiedBlocks[newDateKey]) {
          copiedBlocks[newDateKey] = []
        }
        
        const hours = Math.floor(block.start_hour)
        const minutes = Math.round((block.start_hour - hours) * 60)
        const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        const endHourDecimal = block.start_hour + block.duration
        const endHours = Math.floor(endHourDecimal)
        const endMinutes = Math.round((endHourDecimal - endHours) * 60)
        const endTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
        
        copiedBlocks[newDateKey].push({
          id: `temp-${Date.now()}-${index}`,
          activityId: block.activity_id,
          startTime: startTime,
          endTime: endTime,
          duration: block.duration
        })
      })
      
      // Update the state - WeekCalendar will now respond to this change
      setWeekBlocks(copiedBlocks)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 3000)
      
      // Save to database
      const serviceBlocks = prepareBlocksForService(copiedBlocks)
      await batchSaveTimeBlocks(user.id, currentWeek, serviceBlocks)
      const updatedSchedule = await createOrUpdateWeekSchedule(user.id, currentWeek, 'draft')
      setWeekSchedule(updatedSchedule)
      
    } catch (error) {
      console.error('Error copying last week:', error)
      setCopyError('Failed to copy last week\'s schedule')
    } finally {
      setIsCopying(false)
    }
  }, [user, currentWeek, isCopying])

  // Clear copy error after 3 seconds
  React.useEffect(() => {
    if (copyError) {
      const timer = setTimeout(() => setCopyError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [copyError])

  const getStatusBadge = useCallback(() => {
    switch (scheduleStatus) {
      case 'draft':
        return (
          <div className="flex items-center text-sm text-muted-foreground">
            <Clock className="mr-1 h-4 w-4" />
            Draft
          </div>
        )
      case 'submitted':
        return (
          <div className="flex items-center text-sm text-blue-600">
            <AlertCircle className="mr-1 h-4 w-4" />
            Submitted - Pending Approval
          </div>
        )
      case 'approved':
        return (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="mr-1 h-4 w-4" />
            Approved
          </div>
        )
    }
  }, [scheduleStatus])

  const onWeekCalendarUpdate = useCallback((blocks: Record<string, WeekCalendarTimeBlock[]>) => {
    setWeekBlocks(blocks)
    const unassigned = Object.values(blocks).some((dayBlocks) => 
      dayBlocks.some((block) => !block.activityId)
    )
    setHasUnassignedBlocks(unassigned)
  }, [])

  // Track previous blocks to detect real changes
  const previousBlocksRef = React.useRef<string>('')

  // Auto-save functionality
  useEffect(() => {
    if (!user || !weekBlocks || Object.keys(weekBlocks).length === 0 || scheduleStatus === 'approved' || isSaving) return
    
    // Convert blocks to string for comparison
    const currentBlocksString = JSON.stringify(weekBlocks)
    
    // Skip if blocks haven't actually changed (just selection changed)
    if (currentBlocksString === previousBlocksRef.current) return
    
    const autoSave = async () => {
      setIsAutoSaving(true) // Use separate state for auto-save
      try {
        const serviceBlocks = prepareBlocksForService(weekBlocks)
        await batchSaveTimeBlocks(user.id, currentWeek, serviceBlocks)
        const currentStatus = weekSchedule?.status || 'draft'
        if (currentStatus !== 'submitted') {
            const updatedSchedule = await createOrUpdateWeekSchedule(user.id, currentWeek, currentStatus)
            setWeekSchedule(updatedSchedule)
        }
        // Update the reference after successful save
        previousBlocksRef.current = currentBlocksString
      } catch (error) {
        console.error('Auto-save error:', error)
      } finally {
        setIsAutoSaving(false)
      }
    }

    const timeoutId = setTimeout(autoSave, 1500) // Increased debounce to 1.5s
    return () => clearTimeout(timeoutId)
  }, [user, currentWeek, weekBlocks, weekSchedule?.status, scheduleStatus, isSaving])

  const hasBlocks = Object.values(weekBlocks).some(dayBlocks => dayBlocks.length > 0)
  const canSubmit = user && !isPastWeek && !isAfterWeekEnd && scheduleStatus !== 'approved' && hasBlocks && !hasUnassignedBlocks && !isSaving

  if (isLoadingUser) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-screen">
        <Card>
          <CardContent className="py-8 flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <div className="text-center text-muted-foreground">Loading User Data...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-screen">
         <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to view the dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login"> {/* Assuming /login is your login page route */}
                <Button className="w-full">Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // If user is loaded, but week data is still loading
  if (isLoadingWeekData) {
     return (
      <div className="container mx-auto py-8 px-4">
        {/* <TestSetup /> Can be added here if desired for dev environments */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Enter your hours for each activity.</CardTitle>
              </div>
               {/* Placeholder for status badge while loading */}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex items-center justify-between">
                <WeekSelector
                  currentWeek={currentWeek}
                  onWeekChange={setCurrentWeek}
                  minWeek={user?.role === 'resident' ? currentWeekStart : undefined}
                />
              </div>
              <div className="flex justify-center items-center h-64 border rounded-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-2 text-muted-foreground">Loading week data...</p>
              </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* <TestSetup /> Can be added here if desired for dev environments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enter your hours for each activity.</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <WeekSelector
              currentWeek={currentWeek}
              onWeekChange={setCurrentWeek}
              minWeek={user?.role === 'resident' ? currentWeekStart : undefined}
            />
            
            {isEditable && (scheduleStatus === 'draft' || scheduleStatus === 'submitted') && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLastWeek}
                disabled={isSaving || isCopying}
              >
                {isCopying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Copying...
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Last Week
                  </>
                )}
              </Button>
            )}
          </div>

          <WeekCalendar
            weekStart={currentWeek}
            isReadOnly={!isEditable || isSaving} // Also make read-only if saving
            initialBlocks={weekBlocks}
            onUpdate={onWeekCalendarUpdate}
          />

          {copySuccess && (
            <div className="bg-green-50 p-4 rounded-lg text-sm text-green-700">
              Successfully copied schedule from previous week!
            </div>
          )}

          {copyError && (
            <div className="bg-red-50 p-4 rounded-lg text-sm text-red-700">
              {copyError}
            </div>
          )}

          {isAfterWeekEnd && user?.role === 'resident' && scheduleStatus !== 'approved' && (
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              This week has ended and can no longer be edited. Contact your program director if changes are needed.
            </div>
          )}

          {scheduleStatus === 'approved' && (
            <div className="bg-green-50 p-4 rounded-lg text-sm text-green-700">
              This week's schedule has been approved and can no longer be edited.
            </div>
          )}

          {isPastWeek && user?.role === 'resident' && (
            <div className="bg-muted p-4 rounded-lg text-sm text-muted-foreground">
              Past weeks are read-only for residents. Contact your program director if changes are needed.
            </div>
          )}
        </CardContent>

        {isEditable && (
          <CardFooter className="flex justify-end">
            <div className="flex items-center gap-4">
              {!hasBlocks && (
                <p className="text-sm text-muted-foreground">
                  Add time blocks to submit your schedule
                </p>
              )}
              {hasUnassignedBlocks && (
                <p className="text-sm text-red-600">
                  All time blocks must be assigned to an activity
                </p>
              )}
              {(isPastWeek || isAfterWeekEnd) && scheduleStatus !== 'approved' && (
                <p className="text-sm text-muted-foreground">
                  This week can no longer be submitted
                </p>
              )}
              
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSaving} // isSaving already part of canSubmit logic, but good for clarity
                variant={scheduleStatus === 'submitted' ? 'secondary' : 'default'}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSaving ? 'Saving...' : scheduleStatus === 'submitted' ? 'Resubmit for Approval' : 'Submit for Approval'}
              </Button>
              
              {scheduleStatus === 'submitted' && user?.role !== 'resident' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  disabled={isSaving}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve
                </Button>
              )}
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}