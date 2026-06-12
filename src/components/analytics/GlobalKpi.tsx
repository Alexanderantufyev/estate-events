import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { useEventStore } from '../../store/eventStore'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency, formatPercent } from '../../utils/formatters'
import { cn } from '../../utils/cn'

export function GlobalKpi() {
  const { getFilteredEvents } = useEventStore()
  const events = getFilteredEvents()

  const allMetrics = events.map((e) => calculateMetrics(e.revenue, e.expenses))

  const totalRevenue = allMetrics.reduce((s, m) => s + m.totalRevenue, 0)
  const totalExpenses = allMetrics.reduce((s, m) => s + m.totalExpenses, 0)
  const totalProfit = totalRevenue - totalExpenses
  const avgRoi =
    allMetrics.filter((m) => m.totalExpenses > 0).length > 0
      ? allMetrics
          .filter((m) => m.totalExpenses > 0)
          .reduce((s, m) => s + m.roi, 0) /
        allMetrics.filter((m) => m.totalExpenses > 0).length
      : 0

  const profitable = allMetrics.filter((m) => m.profitability === 'profitable').length
  const loss = allMetrics.filter((m) => m.profitability === 'loss').length
  const risk = allMetrics.filter((m) => m.profitability === 'risk').length

  const confirmed = events.filter((e) => e.status === 'confirmed').length
  const planned = events.filter((e) => e.status === 'planned').length
  const completed = events.filter((e) => e.status === 'completed').length

  const kpis = [
    {
      label: 'Общий доход',
      value: formatCurrency(totalRevenue),
      icon: TrendingUp,
      color: 'text-pomor-500',
      bg: 'bg-pomor-50 dark:bg-pomor-500/10',
      trend: null,
    },
    {
      label: 'Общие расходы',
      value: formatCurrency(totalExpenses),
      icon: TrendingDown,
      color: 'text-red-500',
      bg: 'bg-red-50 dark:bg-red-500/10',
      trend: null,
    },
    {
      label: 'Чистая прибыль',
      value: formatCurrency(totalProfit),
      icon: DollarSign,
      color: totalProfit >= 0 ? 'text-blue-500' : 'text-red-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      trend: null,
    },
    {
      label: 'Средний ROI',
      value: formatPercent(avgRoi),
      icon: TrendingUp,
      color: avgRoi >= 0 ? 'text-purple-500' : 'text-red-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      trend: null,
    },
    {
      label: 'Всего мероприятий',
      value: `${events.length}`,
      sub: `${completed} завершено · ${confirmed} подтверждено · ${planned} в плане`,
      icon: Calendar,
      color: 'text-slate-700 dark:text-slate-200',
      bg: 'bg-slate-50 dark:bg-slate-800',
      trend: null,
    },
    {
      label: 'Рентабельность',
      value: `${profitable} / ${events.length}`,
      sub: `${loss} убыточных · ${risk} в зоне риска`,
      icon: profitable > loss ? CheckCircle : XCircle,
      color: profitable > loss ? 'text-pomor-500' : 'text-red-500',
      bg: profitable > loss ? 'bg-pomor-50 dark:bg-pomor-500/10' : 'bg-red-50 dark:bg-red-500/10',
      trend: null,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.07 }}
          className="kpi-card"
        >
          <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', kpi.bg)}>
            <kpi.icon size={16} className={kpi.color} />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{kpi.label}</p>
            <p className={cn('text-xl font-bold', kpi.color)}>{kpi.value}</p>
            {kpi.sub && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{kpi.sub}</p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
