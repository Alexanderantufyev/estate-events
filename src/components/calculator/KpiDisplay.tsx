import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Target,
  Users,
  DollarSign,
} from 'lucide-react'
import type { FinancialMetrics } from '../../types'
import {
  PROFITABILITY_LABELS,
  PROFITABILITY_BG,
  PROFITABILITY_COLORS,
} from '../../types'
import { formatCurrency, formatPercent, formatNumber } from '../../utils/formatters'
import { cn } from '../../utils/cn'

interface KpiDisplayProps {
  metrics: FinancialMetrics
}

export function KpiDisplay({ metrics }: KpiDisplayProps) {
  const isProfit = metrics.netProfit >= 0

  const kpis = [
    {
      label: 'Чистая прибыль',
      value: formatCurrency(metrics.netProfit),
      icon: isProfit ? TrendingUp : TrendingDown,
      color: isProfit ? 'text-pomor-500' : 'text-red-500',
      bg: isProfit ? 'bg-pomor-50 dark:bg-pomor-500/10' : 'bg-red-50 dark:bg-red-500/10',
      iconColor: isProfit ? 'text-pomor-500' : 'text-red-500',
    },
    {
      label: 'ROI',
      value: formatPercent(metrics.roi),
      icon: Percent,
      color: metrics.roi >= 0 ? 'text-blue-500' : 'text-red-500',
      bg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Маржинальность',
      value: formatPercent(metrics.margin),
      icon: Target,
      color: metrics.margin >= 0 ? 'text-purple-500' : 'text-red-500',
      bg: 'bg-purple-50 dark:bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
    {
      label: 'Точка безубыточности',
      value:
        metrics.breakeven > 0
          ? `${formatNumber(metrics.breakeven)} билетов`
          : 'Н/Д',
      icon: DollarSign,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Прибыль на посетителя',
      value:
        metrics.profitPerAttendee !== 0
          ? formatCurrency(metrics.profitPerAttendee)
          : 'Н/Д',
      icon: Users,
      color:
        metrics.profitPerAttendee >= 0 ? 'text-teal-500' : 'text-red-500',
      bg: 'bg-teal-50 dark:bg-teal-500/10',
      iconColor: 'text-teal-500',
    },
  ]

  return (
    <div className="space-y-4">
      <div
        className={cn(
          'rounded-xl border p-4 text-center',
          PROFITABILITY_BG[metrics.profitability]
        )}
      >
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
          Статус рентабельности
        </p>
        <p
          className={cn(
            'text-xl font-bold',
            PROFITABILITY_COLORS[metrics.profitability]
          )}
        >
          {PROFITABILITY_LABELS[metrics.profitability]}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Доход: {formatCurrency(metrics.totalRevenue)} · Расход:{' '}
          {formatCurrency(metrics.totalExpenses)}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={cn('rounded-xl p-3.5 flex items-start gap-3', kpi.bg)}
          >
            <div className={cn('p-2 rounded-lg bg-white/60 dark:bg-black/20')}>
              <kpi.icon size={14} className={kpi.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-none mb-1">
                {kpi.label}
              </p>
              <p className={cn('text-base font-bold leading-none truncate', kpi.color)}>
                {kpi.value}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
