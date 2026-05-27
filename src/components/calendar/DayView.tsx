import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { Clock, MapPin, User, TrendingUp, TrendingDown } from 'lucide-react'
import { useEventStore } from '../../store/eventStore'
import type { EventItem } from '../../types'
import {
  STATUS_COLORS,
  STATUS_LABELS,
  STATUS_CHIP_COLORS,
} from '../../types'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'
import { Badge } from '../ui/Badge'
import { cn } from '../../utils/cn'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const HOUR_HEIGHT = 80

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export function DayView() {
  const { currentDate, getFilteredEvents, setSelectedEventId, setIsCreateModalOpen } =
    useEventStore()

  const date = parseISO(currentDate)
  const dateStr = format(date, 'yyyy-MM-dd')
  const today = new Date()
  const isToday = format(today, 'yyyy-MM-dd') === dateStr

  const events = getFilteredEvents().filter((e) => e.date === dateStr)

  return (
    <div className="space-y-4">
      <div className="glass-card p-4 flex items-center gap-4">
        <div
          className={cn(
            'w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold',
            isToday
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
          )}
        >
          {format(date, 'd')}
        </div>
        <div>
          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100 capitalize">
            {format(date, 'EEEE', { locale: ru })}
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {format(date, 'd MMMM yyyy', { locale: ru })}
          </p>
        </div>
        <div className="ml-auto">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Мероприятий:{' '}
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {events.length}
            </span>
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <div
          className="glass-card p-16 text-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <p className="text-4xl mb-3">📅</p>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            На этот день нет мероприятий
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Нажмите, чтобы создать
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            <div className="flex">
              <div className="w-16 shrink-0 border-r border-slate-100 dark:border-slate-800">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-b border-slate-100 dark:border-slate-800/60 flex items-start pt-1 px-2 justify-end"
                  >
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                      {String(h).padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex-1 relative">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    style={{ height: HOUR_HEIGHT }}
                    className="border-b border-slate-100 dark:border-slate-800/60"
                  />
                ))}

                {events.map((event) => (
                  <DayEventBlock
                    key={event.id}
                    event={event}
                    onSelect={() => setSelectedEventId(event.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="space-y-3">
          {events.map((event) => (
            <DayEventCard
              key={event.id}
              event={event}
              onSelect={() => setSelectedEventId(event.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DayEventBlock({
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
  const height = Math.max((duration / 60) * HOUR_HEIGHT, 32)

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      style={{ top, height, position: 'absolute', left: 8, right: 8 }}
      className={cn(
        'rounded-xl px-3 py-2 cursor-pointer overflow-hidden shadow-md z-10',
        STATUS_CHIP_COLORS[event.status]
      )}
    >
      <p className="text-sm font-semibold truncate">{event.title}</p>
      {height > 40 && (
        <p className="text-xs opacity-80">
          {event.time} — {event.endTime}
        </p>
      )}
    </motion.div>
  )
}

function DayEventCard({
  event,
  onSelect,
}: {
  event: EventItem
  onSelect: () => void
}) {
  const metrics = calculateMetrics(event.revenue, event.expenses)
  const hasData = metrics.totalRevenue > 0 || metrics.totalExpenses > 0

  return (
    <motion.div
      whileHover={{ y: -1 }}
      onClick={onSelect}
      className="glass-card p-4 cursor-pointer hover:shadow-2xl transition-all"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'w-1 self-stretch rounded-full',
            event.status === 'planned' && 'bg-blue-500',
            event.status === 'confirmed' && 'bg-emerald-500',
            event.status === 'completed' && 'bg-purple-500',
            event.status === 'cancelled' && 'bg-red-500'
          )}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{event.title}</h3>
            <Badge className={STATUS_COLORS[event.status]}>
              {STATUS_LABELS[event.status]}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Clock size={11} />
              {event.time} — {event.endTime}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <MapPin size={11} />
                {event.location}
              </span>
            )}
            {event.organizer && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <User size={11} />
                {event.organizer}
              </span>
            )}
          </div>

          {hasData && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-emerald-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {formatCurrency(metrics.totalRevenue)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-red-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {formatCurrency(metrics.totalExpenses)}
                </span>
              </div>
              <div
                className={cn(
                  'text-xs font-semibold',
                  metrics.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'
                )}
              >
                {metrics.netProfit >= 0 ? '+' : ''}
                {formatCurrency(metrics.netProfit)}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
