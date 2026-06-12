import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { useEventStore } from '../../store/eventStore'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  EVENT_TYPE_LABELS,
  PROFITABILITY_COLORS,
  STATUS_DOT_COLORS,
} from '../../types'
import { Badge } from '../ui/Badge'
import { cn } from '../../utils/cn'

type SortKey = 'date' | 'title' | 'revenue' | 'expenses' | 'profit' | 'roi'
type SortDir = 'asc' | 'desc'

export function EventsTable() {
  const { getFilteredEvents, setSelectedEventId, setIsAnalyticsView } = useEventStore()
  const events = getFilteredEvents()

  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'date',
    dir: 'desc',
  })

  const rows = events.map((e) => ({
    ...e,
    metrics: calculateMetrics(e.revenue, e.expenses),
  }))

  const sorted = [...rows].sort((a, b) => {
    let av: number | string = 0
    let bv: number | string = 0

    if (sort.key === 'date') { av = a.date; bv = b.date }
    else if (sort.key === 'title') { av = a.title; bv = b.title }
    else if (sort.key === 'revenue') { av = a.metrics.totalRevenue; bv = b.metrics.totalRevenue }
    else if (sort.key === 'expenses') { av = a.metrics.totalExpenses; bv = b.metrics.totalExpenses }
    else if (sort.key === 'profit') { av = a.metrics.netProfit; bv = b.metrics.netProfit }
    else if (sort.key === 'roi') { av = a.metrics.roi; bv = b.metrics.roi }

    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return sort.dir === 'asc' ? cmp : -cmp
  })

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' }
    )
  }

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sort.key !== col)
      return <ArrowUpDown size={11} className="text-slate-400" />
    return sort.dir === 'asc' ? (
      <ArrowUp size={11} className="text-pomor-500" />
    ) : (
      <ArrowDown size={11} className="text-pomor-500" />
    )
  }

  const Th = ({
    col,
    label,
    className,
  }: {
    col: SortKey
    label: string
    className?: string
  }) => (
    <th
      onClick={() => toggleSort(col)}
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 select-none whitespace-nowrap',
        className
      )}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon col={col} />
      </span>
    </th>
  )

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          Все мероприятия
        </h3>
        <span className="text-xs text-slate-400 dark:text-slate-500">{rows.length} записей</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
              <Th col="title" label="Мероприятие" />
              <Th col="date" label="Дата" />
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                Статус
              </th>
              <Th col="revenue" label="Доход" className="text-right" />
              <Th col="expenses" label="Расход" className="text-right" />
              <Th col="profit" label="Прибыль" className="text-right" />
              <Th col="roi" label="ROI" className="text-right" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-slate-400 dark:text-slate-500"
                >
                  Мероприятия не найдены
                </td>
              </tr>
            )}
            {sorted.map((row, i) => (
              <motion.tr
                key={row.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  setIsAnalyticsView(false)
                  setSelectedEventId(row.id)
                }}
                className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full shrink-0',
                        STATUS_DOT_COLORS[row.status]
                      )}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                        {row.title}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {EVENT_TYPE_LABELS[row.type]} · {row.location}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                  {formatDate(row.date)}
                </td>
                <td className="px-4 py-3">
                  <Badge className={STATUS_COLORS[row.status]}>
                    {STATUS_LABELS[row.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right text-sm text-pomor-600 dark:text-pomor-400 font-medium whitespace-nowrap">
                  {formatCurrency(row.metrics.totalRevenue)}
                </td>
                <td className="px-4 py-3 text-right text-sm text-red-500 dark:text-red-400 font-medium whitespace-nowrap">
                  {formatCurrency(row.metrics.totalExpenses)}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span
                    className={cn(
                      'text-sm font-semibold flex items-center justify-end gap-1',
                      row.metrics.netProfit >= 0 ? 'text-pomor-600 dark:text-pomor-400' : 'text-red-500 dark:text-red-400'
                    )}
                  >
                    {row.metrics.netProfit >= 0 ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {formatCurrency(row.metrics.netProfit)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <span
                    className={cn(
                      'text-sm font-semibold',
                      PROFITABILITY_COLORS[row.metrics.profitability]
                    )}
                  >
                    {formatPercent(row.metrics.roi)}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
