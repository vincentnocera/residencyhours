'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Plus, Minus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Activity, TimeEntry } from '@/types'
import { mockActivities } from '@/lib/mock-data'

interface WeekEntryFormProps {
  weekDays: { date: Date; dayName: string }[]
  scheduleId?: string
  onUpdate?: (entries: TimeEntry[]) => void
  isReadOnly?: boolean
}

interface DayEntry {
  activityId: string
  hours: number
}

export function WeekEntryForm({ weekDays, scheduleId, onUpdate, isReadOnly = false }: WeekEntryFormProps) {
  // Initialize with empty entries for each day
  const [dayEntries, setDayEntries] = useState<Record<string, DayEntry[]>>(
    weekDays.reduce((acc, day) => {
      acc[format(day.date, 'yyyy-MM-dd')] = []
      return acc
    }, {} as Record<string, DayEntry[]>)
  )

  const addEntry = (dateKey: string) => {
    setDayEntries(prev => ({
      ...prev,
      [dateKey]: [...prev[dateKey], { activityId: '', hours: 0 }]
    }))
  }

  const removeEntry = (dateKey: string, index: number) => {
    setDayEntries(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].filter((_, i) => i !== index)
    }))
  }

  const updateEntry = (dateKey: string, index: number, field: 'activityId' | 'hours', value: string | number) => {
    setDayEntries(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    }))
  }

  const adjustHours = (dateKey: string, index: number, increment: number) => {
    setDayEntries(prev => ({
      ...prev,
      [dateKey]: prev[dateKey].map((entry, i) => {
        if (i === index) {
          const newHours = Math.max(0, Math.min(24, entry.hours + increment))
          return { ...entry, hours: newHours }
        }
        return entry
      })
    }))
  }

  const getDayTotal = (dateKey: string) => {
    return dayEntries[dateKey].reduce((sum, entry) => sum + entry.hours, 0)
  }

  const getWeekTotal = () => {
    return Object.values(dayEntries).reduce((sum, entries) => 
      sum + entries.reduce((daySum, entry) => daySum + entry.hours, 0), 0
    )
  }

  const getActivityTotal = (activityId: string) => {
    return Object.values(dayEntries).reduce((sum, entries) => 
      sum + entries.filter(e => e.activityId === activityId).reduce((actSum, entry) => actSum + entry.hours, 0), 0
    )
  }

  const usedActivities = Object.values(dayEntries).flat().map(e => e.activityId).filter(Boolean)
  const activityTotals = mockActivities.filter(a => usedActivities.includes(a.id))

  return (
    <div className="space-y-6">
      {/* Week Summary */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Week Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
              <p className={`text-2xl font-bold ${getWeekTotal() > 80 ? 'text-red-600' : 'text-green-600'}`}>
                {getWeekTotal().toFixed(1)}
              </p>
              {getWeekTotal() > 80 && (
                <p className="text-xs text-red-600">Exceeds 80 hour limit</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activities This Week</p>
              <div className="space-y-1 mt-2">
                {activityTotals.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: activity.color }}
                      />
                      {activity.display_name}
                    </span>
                    <span className="font-medium">{getActivityTotal(activity.id).toFixed(1)}h</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Entries */}
      <div className="space-y-4">
        {weekDays.map(({ date, dayName }) => {
          const dateKey = format(date, 'yyyy-MM-dd')
          const entries = dayEntries[dateKey]
          const dayTotal = getDayTotal(dateKey)

          return (
            <Card key={dateKey} className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{dayName}</h4>
                    <p className="text-sm text-muted-foreground">{format(date, 'MMM d, yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Day Total</p>
                    <p className={`text-xl font-bold ${dayTotal > 24 ? 'text-red-600' : ''}`}>
                      {dayTotal.toFixed(1)}h
                    </p>
                  </div>
                </div>

                {/* Entries */}
                <div className="space-y-2">
                  {entries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Select
                        value={entry.activityId}
                        onValueChange={(value) => updateEntry(dateKey, index, 'activityId', value)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select activity..." />
                        </SelectTrigger>
                        <SelectContent>
                          {mockActivities.map(activity => (
                            <SelectItem key={activity.id} value={activity.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: activity.color }}
                                />
                                {activity.display_name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => adjustHours(dateKey, index, -0.5)}
                          disabled={isReadOnly || entry.hours === 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <div className="w-16 text-center font-medium">
                          {entry.hours.toFixed(1)}h
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => adjustHours(dateKey, index, 0.5)}
                          disabled={isReadOnly || entry.hours === 24}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeEntry(dateKey, index)}
                        disabled={isReadOnly}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add Entry Button */}
                {!isReadOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addEntry(dateKey)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Activity
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}