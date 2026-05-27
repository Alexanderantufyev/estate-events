import { motion } from 'framer-motion'
import type { EventItem } from '../../types'
import { STATUS_CHIP_COLORS } from '../../types'
import { calculateMetrics } from '../../utils/calculations'
import { useEventStore } from '../../store/eventStore'
import { cn } from '../../utils/cn'

interface MiniEventCardProps {
  event: EventItem
  compact?: boolean
}

export function MiniEventCard({ event, compact = false }: MiniEventCardProps) {
  const { setSelectedEventId } = useEventStore()
  const metrics = calculateMetrics(event.revenue, event.expenses)

  const hasFinancialData =
    metrics.totalRevenue > 0 || metrics.totalExpenses > 0

  const profitDot = hasFinancialData
    ? metrics.profitability === 'profitable'
      ? 'bg-emerald-400'
      : metrics.profitability === 'loss'
      ? 'bg-red-400'
      : 'bg-amber-400'
    : null

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={(e) => {
        e.stopPropagation()
        setSelectedEventId(event.id)
      }}
      className={cn(
        'event-chip flex items-center gap-1',
        STATUS_CHIP_COLORS[event.status]
      )}
    >
      {profitDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', profitDot)} />
      )}
      <span className="truncate">
        {compact ? event.title : `${event.time} ${event.title}`}
      </span>
    </motion.div>
  )
}
