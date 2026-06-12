import { motion } from 'framer-motion'
import {
  startOfWeek,
  addDays,
  format,
  isSameDay,
  parseISO,
} from 'date-fns'
import { ru } from 'date-fns/locale'
import { useEventStore } from '../../store/eventStore'
import type { EventItem } from '../../types'
import { STATUS_CHIP_COLORS } from '../../types'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'
import { cn } from '../../utils/cn'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 64

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function WeekView() {
  const { currentDate, getFilteredEvents, setSelectedEventId, setCurrentDate, setIsCreateModalOpen } =
    useEventStore()

  const date = parseISO(currentDate)
  const weekStart = startOfWeek(date, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const today = new Date()
  const events = getFilteredEvents()

  const getEventsForDay = (day: Date) =>
    events.filter((e) => e.date === format(day, 'yyyy-MM-dd'))

  return (
    <div className="glass-card overflow-hidden">
      <div className="grid grid-cols-8 border-b border-slate-100 dark:border-slate-800">
        <div className="py-3 text-center border-r border-slate-100 dark:border-slate-800" />
        {days.map((day, i) => (
          <div
            key={i}
            className={cn(
              'py-3 text-center border-r border-slate-100 dark:border-slate-800 last:border-r-0',
              isSameDay(day, today) && 'bg-pomor-50/50 dark:bg-pomor-500/5'
            )}
          >
            <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
              {format(day, 'EEE', { locale: ru })}
            </p>
            <p
              className={cn(
                'text-lg font-bold mt-0.5 w-9 h-9 mx-auto flex items-center justify-center rounded-full transition-colors',
                isSameDay(day, today)
                  ? 'bg-pomor-500 text-white'
                  : 'text-slate-700 dark:text-slate-200'
              )}
            >
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
        <div className="grid grid-cols-8">
          <div className="border-r border-slate-100 dark:border-slate-800">
            {HOURS.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="border-b border-slate-100 dark:border-slate-800/60 flex items-start pt-1 pr-2 justify-end"
              >
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                  {String(h).padStart(2, '0')}:00
                </span>
              </div>
            ))}
          </div>

          {days.map((day, di) => {
            const dayEvents = getEventsForDay(day)
            return (
              <div
                key={di}
                className={cn(
                  'border-r border-slate-100 dark:border-slate-800 last:border-r-0 relative',
                  isSameDay(day, today) && 'bg-pomor-50/20 dark:bg-pomor-500/5'
                )}
                onClick={() => {
                  setCurrentDate(format(day, 'yyyy-MM-dd'))
                  setIsCreateModalOpen(true)
                }}
              >
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-b border-slate-100 dark:border-slate-800/60"
                  />
                ))}

                {dayEvents.map((event) => (
                  <WeekEventBlock
                    key={event.id}
                    event={event}
                    onSelect={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function WeekEventBlock({
  event,
  onSelect,
}: {
  event: EventItem
  onSelect: () => void
}) {
  const startMin = timeToMinutes(event.time || '09:00')
  const endMin = timeToMinutes(event.endTime || '10:00')
  const duration = Math.max(endMin - startMin, 30)

  const top = (startMin / 60) * HOUR_HEIGHT
  const height = Math.max((duration / 60) * HOUR_HEIGHT, 28)

  const metrics = calculateMetrics(event.revenue, event.expenses)
  const hasData = metrics.totalRevenue > 0 || metrics.totalExpenses > 0

  return (
    <motion.div
      whileHover={{ scale: 1.02, zIndex: 10 }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      style={{ top, height, position: 'absolute', left: 2, right: 2 }}
      className={cn(
        'rounded-lg px-2 py-1 cursor-pointer overflow-hidden shadow-sm z-10',
        STATUS_CHIP_COLORS[event.status]
      )}
    >
      <p className="text-[11px] font-semibold truncate leading-tight">{event.title}</p>
      <p className="text-[10px] opacity-80 truncate">
        {event.time} — {event.endTime}
      </p>
      {hasData && height > 50 && (
        <p className="text-[10px] opacity-80 mt-0.5">
          {metrics.netProfit >= 0 ? '+' : ''}
          {formatCurrency(metrics.netProfit)}
        </p>
      )}
    </motion.div>
  )
}
