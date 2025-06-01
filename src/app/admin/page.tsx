"use client"

import { useState, useEffect, useMemo } from 'react'
import { format, startOfWeek, addWeeks, isSameWeek, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { CheckCircle, Clock, AlertCircle, CheckSquare, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCurrentUser } from '@/services/auth'
import { getUsersByRoleAndProgram } from '@/services/usersService'
import { getWeekSchedule, approveWeekSchedule, createOrUpdateWeekSchedule } from '@/services/weekSchedules'
import type { User, WeekSchedule } from '@/types'

interface DisplayWeek {
  offset: number
  start: Date
  label: string
  isCurrent: boolean
}

interface ResidentScheduleStatus {
  [residentId: string]: {
    [weekStartDate: string]: WeekSchedule | null // Store the whole schedule or null if not found
  }
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [residents, setResidents] = useState<User[]>([])
  const [schedulesData, setSchedulesData] = useState<ResidentScheduleStatus>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false) // For actions like approve all

  const [selectedWeeksForBulkApprove, setSelectedWeeksForBulkApprove] = useState<number[]>([])
  const currentDisplayWeek = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), [])
  
  const displayWeeks: DisplayWeek[] = useMemo(() => 
    Array.from({ length: 7 }, (_, i) => {
      const weekOffset = i - 4
      const weekStart = addWeeks(currentDisplayWeek, weekOffset)
      return {
        offset: weekOffset,
        start: weekStart,
        label: format(weekStart, 'MMM d'),
        isCurrent: isSameWeek(weekStart, currentDisplayWeek, { weekStartsOn: 1 })
      }
    }), [currentDisplayWeek])

  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true)
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        if (!user || (user.role !== 'admin' && user.role !== 'program_director')) {
          // Redirect or show access denied message if not admin/PD
          setResidents([])
          setIsLoading(false)
          return
        }

        const fetchedResidents = await getUsersByRoleAndProgram(
          'resident',
          user.role === 'program_director' ? user.program_id || undefined : undefined
        )
        setResidents(fetchedResidents)

      } catch (error) {
        console.error("Error loading initial admin data:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadInitialData()
  }, [])

  useEffect(() => {
    if (!residents.length || !displayWeeks.length) {
      setSchedulesData({})
      return
    }

    async function fetchAllSchedules() {
      setIsLoading(true) // Or a different loading state for schedules
      const allSchedulePromises: Promise<void>[] = []
      const newSchedulesData: ResidentScheduleStatus = {}

      for (const resident of residents) {
        newSchedulesData[resident.id] = {}
        for (const week of displayWeeks) {
          allSchedulePromises.push(
            getWeekSchedule(resident.id, week.start)
              .then(schedule => {
                newSchedulesData[resident.id][format(week.start, 'yyyy-MM-dd')] = schedule
              })
              .catch(err => {
                console.error(`Failed to fetch schedule for ${resident.id} on ${week.start}:`, err)
                newSchedulesData[resident.id][format(week.start, 'yyyy-MM-dd')] = null
              })
          )
        }
      }
      await Promise.all(allSchedulePromises)
      setSchedulesData(newSchedulesData)
      setIsLoading(false)
    }

    fetchAllSchedules()
  }, [residents, displayWeeks])


  const getScheduleForCell = (residentId: string, weekStart: Date): WeekSchedule | null => {
    return schedulesData[residentId]?.[format(weekStart, 'yyyy-MM-dd')] || null
  }

  const getStatusIcon = (schedule: WeekSchedule | null) => {
    const status = schedule?.status || 'draft'
    switch (status) {
      case 'draft': return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'submitted': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-600" />
      default: return null
    }
  }

  const getStatusColor = (schedule: WeekSchedule | null) => {
    const status = schedule?.status || 'draft'
    switch (status) {
      case 'draft': return 'bg-gray-100 hover:bg-gray-200'
      case 'submitted': return 'bg-yellow-100 hover:bg-yellow-200'
      case 'approved': return 'bg-green-100 hover:bg-green-200'
      default: return ''
    }
  }

  const handleCellClick = (residentId: string, weekStart: Date) => {
    console.log('View week for resident:', residentId, weekStart)
    // TODO: Implement navigation or modal display for specific schedule details
  }

  const handleApproveWeek = async (schedule: WeekSchedule) => {
    if (!currentUser || !schedule || schedule.status !== 'submitted') return
    setIsProcessing(true)
    try {
      const updatedSchedule = await approveWeekSchedule(schedule.id, currentUser.id)
      // Update local state
      setSchedulesData(prev => ({
        ...prev,
        [schedule.user_id]: {
          ...prev[schedule.user_id],
          [schedule.week_start_date]: updatedSchedule,
        },
      }))
    } catch (error) {
      console.error('Error approving schedule:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleApproveAllCurrentWeek = async () => {
    if (!currentUser) return
    const currentWeekStartDateKey = format(currentDisplayWeek, 'yyyy-MM-dd')
    const schedulesToApprove: WeekSchedule[] = []
    residents.forEach(res => {
      const schedule = schedulesData[res.id]?.[currentWeekStartDateKey]
      if (schedule && schedule.status === 'submitted') {
        schedulesToApprove.push(schedule)
      }
    })

    if (!schedulesToApprove.length) return
    setIsProcessing(true)
    try {
      await Promise.all(
        schedulesToApprove.map(sch => approveWeekSchedule(sch.id, currentUser.id))
      )
      // Refetch data for the current week for all residents or update locally
      const updatedSchedulesData = { ...schedulesData }
      for (const sch of schedulesToApprove) {
        const approvedSch = { ...sch, status: 'approved' as const, approved_at: new Date().toISOString(), approved_by: currentUser.id };
        if (!updatedSchedulesData[sch.user_id]) updatedSchedulesData[sch.user_id] = {};
        updatedSchedulesData[sch.user_id][sch.week_start_date] = approvedSch;
      }
      setSchedulesData(updatedSchedulesData)

    } catch (error) {
      console.error('Error approving all for current week:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleWeekSelectionForBulkApprove = (weekOffset: number) => {
    setSelectedWeeksForBulkApprove(prev => 
      prev.includes(weekOffset) 
        ? prev.filter(w => w !== weekOffset)
        : [...prev, weekOffset]
    )
  }

  const handleBulkApproveSelectedWeeks = async () => {
    if (!currentUser || !selectedWeeksForBulkApprove.length) return

    const schedulesToApprove: WeekSchedule[] = []
    selectedWeeksForBulkApprove.forEach(offset => {
      const weekStartDate = addWeeks(currentDisplayWeek, offset)
      const weekStartDateKey = format(weekStartDate, 'yyyy-MM-dd')
      residents.forEach(res => {
        const schedule = schedulesData[res.id]?.[weekStartDateKey]
        if (schedule && schedule.status === 'submitted') {
          schedulesToApprove.push(schedule)
        }
      })
    })

    if (!schedulesToApprove.length) return
    setIsProcessing(true)
    try {
      await Promise.all(
        schedulesToApprove.map(sch => approveWeekSchedule(sch.id, currentUser.id))
      )
       // Refetch data or update locally
      const updatedSchedulesData = { ...schedulesData };
      for (const sch of schedulesToApprove) {
        const approvedSch = { ...sch, status: 'approved' as const, approved_at: new Date().toISOString(), approved_by: currentUser.id };
        if (!updatedSchedulesData[sch.user_id]) updatedSchedulesData[sch.user_id] = {};
        updatedSchedulesData[sch.user_id][sch.week_start_date] = approvedSch;
      }
      setSchedulesData(updatedSchedulesData);
      setSelectedWeeksForBulkApprove([]); // Clear selection
    } catch (error) {
      console.error('Error bulk approving weeks:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  if (isLoading && (!currentUser || !residents.length)) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading admin data...</p>
      </div>
    )
  }

  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'program_director')) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent><p>You do not have permission to view this page.</p></CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Approval Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Review and approve resident hours submissions. Click a cell to approve an individual submitted schedule.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Submissions</CardTitle>
              <CardDescription>
                Gray: Draft, Yellow: Submitted, Green: Approved.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedWeeksForBulkApprove.length > 0 && (
                <Button
                  onClick={handleBulkApproveSelectedWeeks}
                  variant="outline"
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : `Approve ${selectedWeeksForBulkApprove.length} Week(s)`}
                </Button>
              )}
              <Button
                onClick={handleApproveAllCurrentWeek}
                disabled={isProcessing}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Approve All Current Week'}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 bg-background p-4 text-left font-medium z-10">
                    Resident
                  </th>
                  {displayWeeks.map(week => (
                    <th 
                      key={week.offset}
                      className={cn(
                        "min-w-[100px] p-4 text-center font-medium relative",
                        week.isCurrent && "bg-blue-50"
                      )}
                    >
                      <div>{week.label}</div>
                      {week.isCurrent && (
                        <div className="text-xs text-blue-600 font-normal">Current</div>
                      )}
                      {week.offset <= 0 && (
                        <input
                          type="checkbox"
                          checked={selectedWeeksForBulkApprove.includes(week.offset)}
                          onChange={() => toggleWeekSelectionForBulkApprove(week.offset)}
                          className="absolute top-2 right-2"
                          onClick={(e) => e.stopPropagation()} // Prevent cell click when clicking checkbox
                          disabled={isProcessing}
                        />
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading && residents.length > 0 ? (
                  <tr><td colSpan={displayWeeks.length + 1} className="p-4 text-center"><Loader2 className="h-6 w-6 animate-spin inline-block mr-2" />Loading schedules...</td></tr>
                ) : residents.length === 0 && !isLoading ? (
                  <tr><td colSpan={displayWeeks.length + 1} className="p-4 text-center text-muted-foreground">No residents found.</td></tr>
                ) : (
                  residents.map(resident => (
                    <tr key={resident.id} className="border-b">
                      <td className="sticky left-0 bg-background p-4 font-medium z-10">
                        {`${resident.first_name} ${resident.last_name}`.trim() || resident.email}
                      </td>
                      {displayWeeks.map(week => {
                        const schedule = getScheduleForCell(resident.id, week.start)
                        const canApproveCell = schedule && schedule.status === 'submitted' && !isProcessing
                        return (
                          <td key={week.offset} className="p-2">
                            <button
                              onClick={() => canApproveCell ? handleApproveWeek(schedule) : handleCellClick(resident.id, week.start)}
                              className={cn(
                                "w-full h-10 rounded flex items-center justify-center transition-colors",
                                getStatusColor(schedule),
                                week.isCurrent && "ring-2 ring-blue-200",
                                !canApproveCell && "cursor-default",
                                canApproveCell && "hover:ring-2 hover:ring-green-500"
                              )}
                              title={canApproveCell ? "Click to Approve" : schedule?.status || 'View Schedule'}
                              disabled={isProcessing}
                            >
                              {getStatusIcon(schedule)}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Draft</div>
        <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-yellow-600" />Submitted</div>
        <div className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" />Approved</div>
      </div>
    </div>
  )
}