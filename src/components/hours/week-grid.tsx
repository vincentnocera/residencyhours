"use client"

import { useState, useCallback } from 'react'
import { format, startOfWeek, addDays } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Activity } from '@/types'
import { mockActivities } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

interface WeekGridProps {
  weekStart: Date
  onHoursChange?: (date: Date, activityId: string, hours: number) => void
  readOnly?: boolean
}

interface HoursData {
  [key: string]: number // key format: "date-activityId"
}

export function WeekGrid({ weekStart, onHoursChange, readOnly = false }: WeekGridProps) {
  const [hoursData, setHoursData] = useState<HoursData>({})
  const activities = mockActivities.filter(a => a.is_active)
  
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i)
    return {
      date,
      dayName: format(date, 'EEEE'),
      dayDate: format(date, 'MMM d')
    }
  })

  const handleHoursChange = useCallback((date: Date, activityId: string, value: string) => {
    const numValue = parseFloat(value) || 0
    const key = `${format(date, 'yyyy-MM-dd')}-${activityId}`
    
    setHoursData(prev => ({
      ...prev,
      [key]: numValue
    }))
    
    onHoursChange?.(date, activityId, numValue)
  }, [onHoursChange])

  const getHours = (date: Date, activityId: string) => {
    const key = `${format(date, 'yyyy-MM-dd')}-${activityId}`
    return hoursData[key] || 0
  }

  const getDayTotal = (date: Date) => {
    return activities.reduce((sum, activity) => {
      return sum + getHours(date, activity.id)
    }, 0)
  }

  const getActivityTotal = (activityId: string) => {
    return weekDays.reduce((sum, day) => {
      return sum + getHours(day.date, activityId)
    }, 0)
  }

  const getWeekTotal = () => {
    return weekDays.reduce((sum, day) => {
      return sum + getDayTotal(day.date)
    }, 0)
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="sticky left-0 bg-background p-4 text-left font-medium">
                  Day
                </th>
                {activities.map(activity => (
                  <th 
                    key={activity.id} 
                    className="min-w-[100px] p-4 text-center font-medium"
                    style={{ color: activity.color }}
                  >
                    {activity.display_name}
                  </th>
                ))}
                <th className="min-w-[100px] p-4 text-center font-medium">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map(({ date, dayName, dayDate }) => {
                const dayTotal = getDayTotal(date)
                const isOverLimit = dayTotal > 24
                
                return (
                  <tr key={date.toISOString()} className="border-b">
                    <td className="sticky left-0 bg-background p-4 font-medium">
                      <div>{dayName}</div>
                      <div className="text-sm text-muted-foreground">{dayDate}</div>
                    </td>
                    {activities.map(activity => (
                      <td key={activity.id} className="p-2">
                        <Input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={getHours(date, activity.id) || ''}
                          onChange={(e) => handleHoursChange(date, activity.id, e.target.value)}
                          className="text-center"
                          disabled={readOnly}
                          placeholder="0"
                        />
                      </td>
                    ))}
                    <td className={cn(
                      "p-4 text-center font-medium",
                      isOverLimit && "text-destructive"
                    )}>
                      {dayTotal.toFixed(1)}
                    </td>
                  </tr>
                )
              })}
              <tr className="font-medium">
                <td className="sticky left-0 bg-background p-4">
                  Weekly Total
                </td>
                {activities.map(activity => (
                  <td key={activity.id} className="p-4 text-center">
                    {getActivityTotal(activity.id).toFixed(1)}
                  </td>
                ))}
                <td className={cn(
                  "p-4 text-center",
                  getWeekTotal() > 80 && "text-destructive"
                )}>
                  {getWeekTotal().toFixed(1)}
                  {getWeekTotal() > 80 && (
                    <div className="text-xs font-normal">Max: 80</div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}