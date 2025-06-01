'use client'

import React, { useState, useEffect } from 'react'
import { format, addDays } from 'date-fns'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getActivities } from '@/services/activities'
import type { Activity } from '@/types/database'
import { cn } from '@/lib/utils'

export interface TimeBlock {
  id: string
  activityId: string | null
  startTime: string
  endTime: string
  duration: number
  notes?: string
}

interface WeekCalendarProps {
  weekStart: Date
  isReadOnly?: boolean
  initialBlocks?: Record<string, TimeBlock[]>
  onUpdate?: (blocks: Record<string, TimeBlock[]>) => void
}

const HOURS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
const HOUR_HEIGHT = 40 // pixels per hour - reduced for better fit

// ID counter to ensure unique IDs
let idCounter = 0

// ActivitySelector component - memoized to prevent unnecessary re-renders
const ActivitySelector = React.memo(({ 
  selectedBlockData, 
  activities, 
  onActivityChange 
}: { 
  selectedBlockData: TimeBlock, 
  activities: Activity[], 
  onActivityChange: (activityId: string) => void 
}) => {
  return (
    <Card className="p-4 mt-4" key={selectedBlockData.id}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Assign Activity</h3>
          {!selectedBlockData.activityId && (
            <span className="text-sm text-red-600">Required</span>
          )}
        </div>
        <Select
          value={selectedBlockData.activityId || ''}
          onValueChange={onActivityChange}
        >
          <SelectTrigger className={cn(
            !selectedBlockData.activityId && "border-red-500"
          )}>
            <SelectValue placeholder="Select an activity..." />
          </SelectTrigger>
          <SelectContent>
            {activities.map(activity => (
              <SelectItem key={activity.id} value={activity.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: activity.color }}
                  />
                  {activity.display_name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {selectedBlockData.duration}h block • 
          {(() => {
            const startHour = timeToHours(selectedBlockData.startTime)
            const endHour = startHour + selectedBlockData.duration
            const formatTime = (h: number) => {
              const hour = Math.floor(h)
              const minutes = (h % 1) * 60
              const period = hour >= 12 ? 'PM' : 'AM'
              const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
              return `${displayHour}:${minutes.toString().padStart(2, '0')} ${period}`
            }
            return `${formatTime(startHour)} - ${formatTime(endHour)}`
          })()}
        </p>
      </div>
    </Card>
  )
})
ActivitySelector.displayName = 'ActivitySelector'

// Add conversion helpers
const timeToHours = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours + minutes / 60
}

const hoursToTime = (hours: number): string => {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

// Helper function to normalize and fill blocks
const normalizeAndFillBlocks = (
  blocksInput: Record<string, TimeBlock[]> | undefined,
  weekStartDate: Date
): Record<string, TimeBlock[]> => {
  const normalizedBlocks: Record<string, TimeBlock[]> = {}
  for (let i = 0; i < 7; i++) {
    const dateKey = format(addDays(weekStartDate, i), 'yyyy-MM-dd')
    normalizedBlocks[dateKey] = (blocksInput && blocksInput[dateKey]) ? blocksInput[dateKey] : []
  }
  return normalizedBlocks
}

export function WeekCalendar({ weekStart, isReadOnly = false, initialBlocks, onUpdate }: WeekCalendarProps) {
  // Initialize state - this only runs once on mount
  const [dayBlocks, setDayBlocks] = useState<Record<string, TimeBlock[]>>(() =>
    normalizeAndFillBlocks(initialBlocks, weekStart)
  );
  
  const [activities, setActivities] = useState<Activity[]>([])
  const [loadingActivities, setLoadingActivities] = useState(true)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  
  // Track the previous week to know when we're changing weeks
  const previousWeekRef = React.useRef(weekStart)
  
  // Ref for the scrollable container
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  
  // Fetch activities on mount
  useEffect(() => {
    async function fetchActivities() {
      try {
        const data = await getActivities()
        setActivities(data)
      } catch (error) {
        console.error('Error fetching activities:', error)
      } finally {
        setLoadingActivities(false)
      }
    }
    fetchActivities()
  }, [])
  
  // Auto-scroll to work hours (8 AM) when component mounts
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Scroll to 8 AM (minus some padding to show a bit before)
      const scrollPosition = (8 - 1) * HOUR_HEIGHT // Start at 7 AM for context
      scrollContainerRef.current.scrollTop = scrollPosition
    }
  }, []) // Only run on mount
  
  // Call onUpdate whenever blocks change
  React.useEffect(() => {
    onUpdate?.(dayBlocks)
  }, [dayBlocks, onUpdate])

  const [dragStart, setDragStart] = useState<{ dateKey: string; hour: number } | null>(null)
  const [dragEnd, setDragEnd] = useState<number | null>(null)
  const [movingBlock, setMovingBlock] = useState<{ blockId: string; dateKey: string; originalStart: number } | null>(null)
  const [resizingBlock, setResizingBlock] = useState<{ blockId: string; dateKey: string; edge: 'top' | 'bottom' } | null>(null)
  const [dragMode, setDragMode] = useState<'none' | 'creating' | 'moving' | 'resizing'>('none')

  const selectedBlockData = React.useMemo(() => {
    if (!selectedBlock) return null;
    const dateKey = Object.keys(dayBlocks).find(key =>
      (dayBlocks[key] || []).some(b => b.id === selectedBlock)
    );
    if (!dateKey) return null;
    return (dayBlocks[dateKey] || []).find(b => b.id === selectedBlock) || null;
  }, [selectedBlock, dayBlocks]);

  const weekDays = Array.from({ length: 7 }, (_, i) => ({
    date: addDays(weekStart, i),
    dayName: format(addDays(weekStart, i), 'EEEE'),
    dateKey: format(addDays(weekStart, i), 'yyyy-MM-dd')
  }))

  const hasOverlap = (dateKey: string, startHour: number, duration: number, excludeId?: string) => {
    const blocks = dayBlocks[dateKey] || []
    return blocks.some(block => {
      if (excludeId && block.id === excludeId) return false
      const blockStart = timeToHours(block.startTime)
      const blockEnd = blockStart + block.duration
      const newEnd = startHour + duration
      return (startHour < blockEnd && newEnd > blockStart)
    })
  }

  const addBlock = (dateKey: string, startHour: number, duration: number = 1) => {
    // Check for overlap
    if (hasOverlap(dateKey, startHour, duration)) {
      return false
    }
    
    const newBlock: TimeBlock = {
      id: `block-${Date.now()}-${++idCounter}`, // More unique ID
      activityId: null, // Start unassigned
      startTime: hoursToTime(startHour),
      endTime: hoursToTime(startHour + duration),
      duration: duration
    }
    
    setDayBlocks(prev => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), newBlock]
    }))
    
    setSelectedBlock(newBlock.id) // Auto-select the new block
    return true
  }

  const removeBlock = (dateKey: string, blockId: string) => {
    setDayBlocks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).filter(b => b.id !== blockId)
    }))
  }

  const updateBlock = (dateKey: string, blockId: string, updates: Partial<TimeBlock>) => {
    setDayBlocks(prev => ({
      ...prev,
      [dateKey]: (prev[dateKey] || []).map(b => 
        b.id === blockId ? { ...b, ...updates } : b
      )
    }))
  }

  const resizeBlock = (dateKey: string, blockId: string, newDuration: number) => {
    const block = dayBlocks[dateKey]?.find(b => b.id === blockId)
    if (!block) return
    
    const startHour = timeToHours(block.startTime)
    const maxDuration = 24 - startHour
    const duration = Math.max(1, Math.min(newDuration, maxDuration))
    
    // Check for overlap with new size
    if (hasOverlap(dateKey, startHour, duration, blockId)) {
      return
    }
    
    updateBlock(dateKey, blockId, { 
      duration: duration,
      endTime: hoursToTime(startHour + duration)
    })
  }

  const getActivity = (activityId: string | null) => {
    if (!activityId) return null
    return activities.find(a => a.id === activityId)
  }

  // Consolidated sync effect for weekStart and initialBlocks
  React.useEffect(() => {
    console.log(
      '[WeekCalendar] Consolidated sync effect. WeekStart:',
      format(weekStart, 'yyyy-MM-dd'),
      'InitialBlocks keys:',
      initialBlocks ? Object.keys(initialBlocks) : 'null'
    );

    const normalizedBlocks = normalizeAndFillBlocks(initialBlocks, weekStart);
    setDayBlocks(normalizedBlocks);

    // Update previousWeekRef if weekStart has actually changed
    if (previousWeekRef.current.getTime() !== weekStart.getTime()) {
      console.log('[WeekCalendar] Week has changed, updating previousWeekRef.');
      previousWeekRef.current = weekStart;
    }
  }, [initialBlocks, weekStart]);

  const getDayTotal = (dateKey: string) => {
    return (dayBlocks[dateKey] || []).reduce((sum, block) => sum + block.duration, 0)
  }

  const getWeekTotal = () => {
    return Object.values(dayBlocks).reduce((sum, blocks) => 
      sum + blocks.reduce((daySum, block) => daySum + block.duration, 0), 0
    )
  }

  // Mouse movement handlers
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragMode === 'moving' && movingBlock) {
        const element = document.elementFromPoint(e.clientX, e.clientY)
        const dayColumn = element?.closest('[data-day]')
        if (dayColumn) {
          const newDateKey = dayColumn.getAttribute('data-day')!
          const rect = dayColumn.getBoundingClientRect()
          const y = e.clientY - rect.top
          
          // Find the block in its current location
          const currentDateKey = Object.keys(dayBlocks).find(key => 
            (dayBlocks[key] || []).some(b => b.id === movingBlock.blockId)
          )
          const block = currentDateKey ? (dayBlocks[currentDateKey] || []).find(b => b.id === movingBlock.blockId) : null
          
          if (block && currentDateKey) {
            const newStartHour = Math.max(0, Math.min(24 - block.duration, 
              Math.round((y / HOUR_HEIGHT) * 2) / 2))
            
            if (!hasOverlap(newDateKey, newStartHour, block.duration, movingBlock.blockId)) {
              if (newDateKey === currentDateKey) {
                // Moving within the same column - just update the start/end times
                updateBlock(currentDateKey, movingBlock.blockId, { 
                  startTime: hoursToTime(newStartHour),
                  endTime: hoursToTime(newStartHour + block.duration)
                })
              } else {
                // Moving to a different column - remove from old and add to new
                const blockToMove = { 
                  ...block, 
                  startTime: hoursToTime(newStartHour),
                  endTime: hoursToTime(newStartHour + block.duration)
                }
                setDayBlocks(prev => {
                  // Ensure we don't have duplicates
                  const newDayBlocks = { ...prev };
                  newDayBlocks[currentDateKey] = (prev[currentDateKey] || []).filter(b => b.id !== movingBlock.blockId);
                  newDayBlocks[newDateKey] = [...(prev[newDateKey] || []).filter(b => b.id !== movingBlock.blockId), blockToMove];
                  return newDayBlocks;
                })
                setMovingBlock({ ...movingBlock, dateKey: newDateKey })
              }
            }
          }
        }
      } else if (dragMode === 'resizing' && resizingBlock) {
        const block = dayBlocks[resizingBlock.dateKey]?.find(b => b.id === resizingBlock.blockId)
        if (!block) return
        
        const element = document.querySelector(`[data-day="${resizingBlock.dateKey}"]`)
        if (element) {
          const rect = element.getBoundingClientRect()
          const y = e.clientY - rect.top
          const hour = Math.round((y / HOUR_HEIGHT) * 2) / 2
          
          if (resizingBlock.edge === 'top') {
            const newStart = Math.max(0, Math.min(timeToHours(block.startTime) + block.duration - 1, hour))
            const newDuration = timeToHours(block.startTime) + block.duration - newStart
            if (!hasOverlap(resizingBlock.dateKey, newStart, newDuration, resizingBlock.blockId)) {
              updateBlock(resizingBlock.dateKey, resizingBlock.blockId, { 
                startTime: hoursToTime(newStart), 
                endTime: hoursToTime(newStart + newDuration),
                duration: newDuration 
              })
            }
          } else {
            const newDuration = Math.max(1, Math.min(24 - timeToHours(block.startTime), hour - timeToHours(block.startTime)))
            if (!hasOverlap(resizingBlock.dateKey, timeToHours(block.startTime), newDuration, resizingBlock.blockId)) {
              updateBlock(resizingBlock.dateKey, resizingBlock.blockId, { 
                duration: newDuration,
                endTime: hoursToTime(timeToHours(block.startTime) + newDuration)
              })
            }
          }
        }
      } else if (dragMode === 'creating' && dragStart) {
        // Handle creating new blocks via drag
        const element = document.elementFromPoint(e.clientX, e.clientY)
        const dayColumn = element?.closest('[data-day]')
        if (dayColumn && dayColumn.getAttribute('data-day') === dragStart.dateKey) {
          const rect = dayColumn.getBoundingClientRect()
          const y = e.clientY - rect.top
          const hour = Math.floor(y / HOUR_HEIGHT)
          const endHour = Math.max(0, Math.min(24, hour + (y % HOUR_HEIGHT > HOUR_HEIGHT / 2 ? 1 : 0.5)))
          setDragEnd(Math.max(dragStart.hour + 1, endHour))
        }
      }
    }

    const handleMouseUp = () => {
      if (dragMode === 'creating' && dragStart && dragEnd) {
        const duration = dragEnd - dragStart.hour
        if (duration >= 1) {
          addBlock(dragStart.dateKey, dragStart.hour, duration)
          
          // Delay cleanup to allow activity selector state to settle
          setTimeout(() => {
            setDragStart(null)
            setDragEnd(null)
            setDragMode('none')
          }, 100) // Increased delay to prevent container click interference
          return
        }
      }
      
      setMovingBlock(null)
      setResizingBlock(null)
      setDragStart(null)
      setDragEnd(null)
      setDragMode('none')
    }

    if (dragMode !== 'none') {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [dragMode, movingBlock, resizingBlock, dragStart, dragEnd, dayBlocks, hasOverlap, updateBlock])

  return (
    <div className="space-y-4" onClick={(e) => {
      if (e.target === e.currentTarget && dragMode === 'none') {
        setSelectedBlock(null)
      }
    }}>
      {/* Week Summary */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Hours</p>
            <p className={cn(
              "text-2xl font-bold",
              getWeekTotal() > 80 ? "text-red-600" : "text-green-600"
            )}>
              {getWeekTotal().toFixed(1)}
            </p>
          </div>
          {getWeekTotal() > 80 && (
            <p className="text-sm text-red-600">Exceeds 80 hour limit</p>
          )}
        </div>
      </Card>

      {/* Calendar Grid */}
      <div 
        ref={scrollContainerRef}
        className="overflow-auto border rounded-lg" 
        style={{ maxHeight: '600px' }}
      >
        <div className="min-w-[1200px]">
          {/* Day Headers */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="text-sm font-medium text-muted-foreground px-2">Time</div>
            {weekDays.map(({ date, dayName, dateKey }) => (
              <div key={dateKey} className="text-center">
                <div className="font-medium">{dayName}</div>
                <div className="text-sm text-muted-foreground">{format(date, 'MMM d')}</div>
                <div className="text-sm font-medium mt-1">
                  {getDayTotal(dateKey).toFixed(1)}h
                </div>
              </div>
            ))}
          </div>

          {/* Time Grid */}
          <div className="relative">
            {/* Hour lines and half-hour lines */}
            <div className="absolute inset-0 grid grid-cols-8 gap-2">
              <div></div>
              {weekDays.map(({ dateKey }) => (
                <div key={dateKey} className="relative">
                  {HOURS.map(hour => (
                    <React.Fragment key={hour}>
                      <div
                        className="absolute w-full border-t border-gray-300"
                        style={{ top: `${hour * HOUR_HEIGHT}px` }}
                      />
                      <div
                        className="absolute w-full border-t border-gray-200 border-dotted"
                        style={{ top: `${(hour + 0.5) * HOUR_HEIGHT}px` }}
                      />
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-8 gap-2" style={{ height: `${24 * HOUR_HEIGHT}px` }}>
              {/* Time Labels */}
              <div className="relative">
                {HOURS.map(hour => {
                  let timeLabel = '';
                  if (hour === 0) {
                    timeLabel = '12 AM';
                  } else if (hour < 12) {
                    timeLabel = `${hour} AM`;
                  } else if (hour === 12) {
                    timeLabel = '12 PM';
                  } else {
                    timeLabel = `${hour - 12} PM`;
                  }
                  return (
                    <div
                      key={hour}
                      className="absolute text-xs text-muted-foreground px-2 flex items-center"
                      style={{
                        top: `${hour * HOUR_HEIGHT}px`,
                        height: `${HOUR_HEIGHT}px`,
                        left: 0,
                        backgroundColor: 'white',
                        paddingRight: '8px',
                        zIndex: 10
                      }}
                    >
                      {timeLabel}
                    </div>
                  );
                })}
              </div>

              {/* Day Columns */}
              {weekDays.map(({ dateKey }) => (
                <div key={dateKey} data-day={dateKey} className="relative bg-gray-50/30 rounded-lg cursor-crosshair">
                  {/* Blocks */}
                  {(dayBlocks[dateKey] || []).map(block => {
                    const activity = getActivity(block.activityId)
                    const isSelected = selectedBlock === block.id
                    const isUnassigned = !block.activityId

                    return (
                      <div
                        key={`${dateKey}-${block.id}`}
                        className={cn(
                          "absolute left-1 right-1 rounded-md p-2 transition-all border-2",
                          "hover:shadow-lg hover:z-10",
                          isSelected && "ring-2 ring-blue-500 z-20",
                          isUnassigned && "border-dashed border-gray-400",
                          !isUnassigned && "border-transparent"
                        )}
                        style={{
                          top: `${timeToHours(block.startTime) * HOUR_HEIGHT}px`,
                          height: `${block.duration * HOUR_HEIGHT}px`,
                          backgroundColor: isUnassigned ? '#e5e7eb' : activity?.color || '#94a3b8',
                          opacity: isUnassigned ? 0.7 : 0.8,
                          cursor: movingBlock?.blockId === block.id ? 'grabbing' : 'grab',
                          zIndex: isSelected ? 20 : 10
                        }}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setSelectedBlock(block.id)
                        }}
                        onMouseDown={(e) => {
                          if (isReadOnly || dragMode !== 'none') return
                          e.stopPropagation()
                          
                          const rect = e.currentTarget.getBoundingClientRect()
                          const relativeY = e.clientY - rect.top
                          const blockHeight = rect.height
                          
                          // Check if clicking near edges for resize
                          if (relativeY < 10) {
                            // Top edge resize
                            e.preventDefault()
                            setResizingBlock({ blockId: block.id, dateKey, edge: 'top' })
                            setDragMode('resizing')
                          } else if (relativeY > blockHeight - 10) {
                            // Bottom edge resize
                            e.preventDefault()
                            setResizingBlock({ blockId: block.id, dateKey, edge: 'bottom' })
                            setDragMode('resizing')
                          } else {
                            // Move block - only on drag, not click
                            const startX = e.clientX
                            const startY = e.clientY
                            let hasMoved = false
                            
                            const handleMouseMove = (moveEvent: MouseEvent) => {
                              const distance = Math.sqrt(
                                Math.pow(moveEvent.clientX - startX, 2) + 
                                Math.pow(moveEvent.clientY - startY, 2)
                              )
                              if (distance > 5 && !hasMoved) {
                                hasMoved = true
                                setMovingBlock({ blockId: block.id, dateKey, originalStart: timeToHours(block.startTime) })
                                setDragMode('moving')
                              }
                            }
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove)
                              document.removeEventListener('mouseup', handleMouseUp)
                            }
                            
                            document.addEventListener('mousemove', handleMouseMove)
                            document.addEventListener('mouseup', handleMouseUp)
                          }
                        }}
                      >
                        <div className={cn(
                          "text-sm font-medium",
                          isUnassigned ? "text-gray-600" : "text-white"
                        )}>
                          {isUnassigned ? "Unassigned" : activity?.display_name}
                        </div>

                        {/* Controls when selected or unassigned */}
                        {(isSelected || isUnassigned) && !isReadOnly && (
                          <div className="absolute top-1 right-1 flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className={cn(
                                "h-6 w-6",
                                isUnassigned 
                                  ? "bg-red-100 hover:bg-red-200 text-red-600" 
                                  : "bg-white/20 hover:bg-white/30 text-white"
                              )}
                              onClick={(e) => {
                                e.stopPropagation()
                                removeBlock(dateKey, block.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {/* Resize handles - visible on hover */}
                        {!isReadOnly && (
                          <>
                            <div
                              className={cn(
                                "absolute top-0 left-0 right-0 h-2 cursor-ns-resize",
                                "opacity-0 hover:opacity-100 bg-black/20"
                              )}
                            />
                            <div
                              className={cn(
                                "absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize",
                                "opacity-0 hover:opacity-100 bg-black/20"
                              )}
                            />
                          </>
                        )}
                      </div>
                    )
                  })}

                  {/* Drag to create new blocks */}
                  {!isReadOnly && (
                    <div
                      className="absolute inset-0"
                      onMouseDown={(e) => {
                        if (dragMode !== 'none') return
                        
                        const rect = e.currentTarget.getBoundingClientRect()
                        const y = e.clientY - rect.top
                        const hour = Math.floor(y / HOUR_HEIGHT)
                        const startHour = Math.max(0, Math.min(23, hour + (y % HOUR_HEIGHT > HOUR_HEIGHT / 2 ? 0.5 : 0)))
                        
                        // Check if clicking on empty space
                        if (!hasOverlap(dateKey, startHour, 1)) {
                          setDragStart({ dateKey, hour: startHour })
                          setDragEnd(startHour + 1)
                          setDragMode('creating')
                        }
                      }}
                    />
                  )}

                  {/* Show drag preview */}
                  {dragStart && dragStart.dateKey === dateKey && dragEnd && (
                    <div
                      className="absolute left-1 right-1 bg-blue-400/30 border-2 border-blue-500 border-dashed rounded-md pointer-events-none"
                      style={{
                        top: `${dragStart.hour * HOUR_HEIGHT}px`,
                        height: `${(dragEnd - dragStart.hour) * HOUR_HEIGHT}px`
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Selector (when block is selected) */}
      {selectedBlockData && !isReadOnly && (
        <ActivitySelector
          selectedBlockData={selectedBlockData}
          activities={activities}
          onActivityChange={(value) => {
            // Find the dateKey for the currently selected block to pass to updateBlock
            const currentSelectedDateKey = Object.keys(dayBlocks).find(key =>
              (dayBlocks[key] || []).some(b => b.id === selectedBlock)
            );
            if (currentSelectedDateKey && selectedBlock) {
              updateBlock(currentSelectedDateKey, selectedBlock, { activityId: value })
            }
          }}
        />
      )}
    </div>
  )
}