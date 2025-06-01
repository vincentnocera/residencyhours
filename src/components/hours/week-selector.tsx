"use client"

import { format, startOfWeek, addWeeks, isSameWeek } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface WeekSelectorProps {
  currentWeek: Date
  onWeekChange: (week: Date) => void
  minWeek?: Date
  maxWeek?: Date
}

export function WeekSelector({ 
  currentWeek, 
  onWeekChange, 
  minWeek,
  maxWeek 
}: WeekSelectorProps) {
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }) // Monday
  const weekEnd = addWeeks(weekStart, 1)
  const today = new Date()
  const isCurrentWeek = isSameWeek(weekStart, today, { weekStartsOn: 1 })

  const handlePreviousWeek = () => {
    const prevWeek = addWeeks(weekStart, -1)
    if (!minWeek || prevWeek >= minWeek) {
      onWeekChange(prevWeek)
    }
  }

  const handleNextWeek = () => {
    const nextWeek = addWeeks(weekStart, 1)
    if (!maxWeek || nextWeek <= maxWeek) {
      onWeekChange(nextWeek)
    }
  }

  const handleCurrentWeek = () => {
    onWeekChange(startOfWeek(today, { weekStartsOn: 1 }))
  }

  const canGoPrevious = !minWeek || addWeeks(weekStart, -1) >= minWeek
  const canGoNext = !maxWeek || addWeeks(weekStart, 1) <= maxWeek

  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousWeek}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center min-w-[200px]">
          <div className="font-semibold">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </div>
          {isCurrentWeek && (
            <div className="text-sm text-muted-foreground">Current Week</div>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleNextWeek}
          disabled={!canGoNext}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {!isCurrentWeek && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCurrentWeek}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Current Week
        </Button>
      )}
    </div>
  )
}