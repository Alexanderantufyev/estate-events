import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  format,
} from 'date-fns'
import { MiniEventCard } from './MiniEventCard'
import { useEventStore } from '../../store/eventStore'
import { calculateMetrics } from '../../utils/calculations'
import { cn } from '../../utils/cn'
import type { SmmPost } from '../../types'

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

const PLATFORM_CHIP: Record<SmmPost['platform'], { label: string; color: string }> = {
  telegram: { label: 'TG', color: 'bg-sky-500 text-white' },
  vk: { label: 'ВК', color: 'bg-blue-600 text-white' },
  instagram: { label: 'IG', color: 'bg-pink-500 text-white' },
}

function formatPostTime(scheduledAt: string): string {
  if (!scheduledAt) return ''
  if (scheduledAt.includes('T')) return scheduledAt.split('T')[1].slice(0, 5)
  return scheduledAt.slice(0, 5)
}

export function MonthView() {
  const {
    currentDate,
    getFilteredEvents,
    setCurrentDate,
    setIsCreateModalOpen,
    setSelectedCalendarDate,
  } = useEventStore()

  const date = parseISO(currentDate)
  const today = new Date()

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [date])

  const events = getFilteredEvents()

  const getEventsForDay = (day: Date) =>
    events.filter((e) => e.date === format(day, 'yyyy-MM-dd'))

  const getScheduledPostsForDay = (day: Date): SmmPost[] => {
    const dateStr = format(day, 'yyyy-MM-dd')
    const posts: SmmPost[] = []
    events.forEach((e) => {
      (e.posts ?? []).forEach((p) => {
        if (p.status === 'scheduled' && p.scheduledAt) {
          const postDate = p.scheduledAt.includes('T')
            ? p.scheduledAt.split('T')[0]
            : dateStr
          if (postDate === dateStr) posts.push(p)
        }
      })
    })
    return posts.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
  }

  const getDayProfitability = (dayEvents: ReturnType<typeof getEventsForDay>) => {
    if (dayEvents.length === 0) return null
    let totalRevenue = 0
    let totalExpenses = 0
    dayEvents.forEach((e) => {
      const m = calculateMetrics(e.revenue, e.expenses)
      totalRevenue += m.totalRevenue
      totalExpenses += m.totalExpenses
    })
    const net = totalRevenue - totalExpenses
    if (net > 0) return 'profitable'
    if (net < 0) return 'loss'
    return 'risk'
  }

  const handleDayClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    setCurrentDate(dateStr)
    setSelectedCalendarDate(dateStr)
  }

  const handleDayDoubleClick = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    setCurrentDate(dateStr)
    setIsCreateModalOpen(true)
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayEvents = getEventsForDay(day)
          const scheduledPosts = getScheduledPostsForDay(day)
          const isToday = isSameDay(day, today)
          const isCurrentMonth = isSameMonth(day, date)
          const isWeekend = day.getDay() === 0 || day.getDay() === 6
          const maxVisible = 3
          const hidden = dayEvents.length - maxVisible
          const profitability = getDayProfitability(dayEvents)

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.005 }}
              onClick={() => handleDayClick(day)}
              onDoubleClick={() => handleDayDoubleClick(day)}
              className={cn(
                'calendar-cell relative',
                !isCurrentMonth && 'opacity-40',
                isWeekend && 'bg-slate-50/50 dark:bg-slate-800/20'
              )}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span
                  className={cn(
                    'text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full transition-colors',
                    isToday
                      ? 'bg-pomor-500 text-white font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              <div className="space-y-0.5">
                {dayEvents.slice(0, maxVisible).map((event) => (
                  <MiniEventCard key={event.id} event={event} />
                ))}
                {hidden > 0 && (
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 pl-1">
                    +{hidden} ещё
                  </p>
                )}
              </div>

              {/* Scheduled post indicators */}
              {scheduledPosts.length > 0 && (
                <div className="flex flex-wrap gap-0.5 mt-1">
                  {scheduledPosts.slice(0, 3).map((post) => {
                    const chip = PLATFORM_CHIP[post.platform]
                    return (
                      <span
                        key={post.id}
                        title={`${chip.label} ${formatPostTime(post.scheduledAt)}: ${post.text.slice(0, 60)}`}
                        className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] font-bold leading-none ${chip.color}`}
                      >
                        {chip.label}
                        {post.scheduledAt && (
                          <span className="opacity-80 font-normal">
                            {formatPostTime(post.scheduledAt)}
                          </span>
                        )}
                      </span>
                    )
                  })}
                  {scheduledPosts.length > 3 && (
                    <span className="text-[9px] text-slate-400 leading-none self-center">
                      +{scheduledPosts.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Profitability bar at the bottom of the cell */}
              {profitability && (
                <div
                  className={cn(
                    'absolute bottom-0 left-0 right-0 h-[3px] rounded-b',
                    profitability === 'profitable' && 'bg-pomor-400/70',
                    profitability === 'loss' && 'bg-red-400/70',
                    profitability === 'risk' && 'bg-amber-400/70'
                  )}
                />
              )}
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
