import { useState, useCallback } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { RevenueData, ExpenseData } from '../../types'
import { RevenueSection } from './RevenueSection'
import { ExpenseSection } from './ExpenseSection'
import { KpiDisplay } from './KpiDisplay'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'

interface ProfitCalculatorProps {
  revenue: RevenueData
  expenses: ExpenseData
  onRevenueChange?: (data: RevenueData) => void
  onExpensesChange?: (data: ExpenseData) => void
  readOnly?: boolean
}

type Tab = 'kpi' | 'revenue' | 'expenses' | 'charts'

const TABS: { key: Tab; label: string }[] = [
  { key: 'kpi', label: 'KPI' },
  { key: 'revenue', label: 'Доходы' },
  { key: 'expenses', label: 'Расходы' },
  { key: 'charts', label: 'Графики' },
]

const PIE_COLORS = [
  '#f87171', '#fb923c', '#fbbf24', '#a3e635',
  '#34d399', '#22d3ee', '#818cf8', '#c084fc', '#f472b6',
]

export function ProfitCalculator({
  revenue,
  expenses,
  onRevenueChange,
  onExpensesChange,
  readOnly = false,
}: ProfitCalculatorProps) {
  const [tab, setTab] = useState<Tab>('kpi')

  const metrics = calculateMetrics(revenue, expenses)

  const handleRevenueChange = useCallback(
    (field: keyof RevenueData, value: number) => {
      if (onRevenueChange) {
        onRevenueChange({ ...revenue, [field]: value })
      }
    },
    [revenue, onRevenueChange]
  )

  const handleExpensesChange = useCallback(
    (field: keyof ExpenseData, value: number) => {
      if (onExpensesChange) {
        onExpensesChange({ ...expenses, [field]: value })
      }
    },
    [expenses, onExpensesChange]
  )

  const barData = [
    { name: 'Доходы', value: metrics.totalRevenue, fill: '#22c55e' },
    { name: 'Расходы', value: metrics.totalExpenses, fill: '#ef4444' },
    { name: 'Прибыль', value: Math.abs(metrics.netProfit), fill: metrics.netProfit >= 0 ? '#6366f1' : '#f97316' },
  ]

  const pieData = [
    { name: 'Площадка', value: expenses.venue },
    { name: 'Реклама', value: expenses.advertising },
    { name: 'Персонал', value: expenses.staff },
    { name: 'Артисты', value: expenses.artists },
    { name: 'Оборудование', value: expenses.equipment },
    { name: 'Кейтеринг', value: expenses.catering },
    { name: 'Транспорт', value: expenses.transport },
    { name: 'Налоги', value: expenses.taxes },
    { name: 'Прочее', value: expenses.other },
  ].filter((d) => d.value > 0)

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean
    payload?: { value: number; name: string }[]
    label?: string
  }) => {
    if (active && payload?.length) {
      return (
        <div className="glass-card px-3 py-2 text-xs shadow-xl">
          <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label || payload[0].name}</p>
          <p className="text-emerald-600 dark:text-emerald-400 font-bold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
              tab === t.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'kpi' && <KpiDisplay metrics={metrics} />}

      {tab === 'revenue' && (
        <RevenueSection
          data={revenue}
          onChange={handleRevenueChange}
          readOnly={readOnly}
        />
      )}

      {tab === 'expenses' && (
        <ExpenseSection
          data={expenses}
          onChange={handleExpensesChange}
          readOnly={readOnly}
        />
      )}

      {tab === 'charts' && (
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Доходы vs Расходы
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} barGap={8}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                  className="text-slate-500 dark:text-slate-400"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'currentColor' }}
                  axisLine={false}
                  tickLine={false}
                  className="text-slate-400"
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}М`
                      : v >= 1000
                      ? `${(v / 1000).toFixed(0)}К`
                      : `${v}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Структура расходов
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [formatCurrency(v), '']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: 'inherit' }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {pieData.length === 0 && (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
              Введите данные о расходах для отображения графика
            </div>
          )}
        </div>
      )}
    </div>
  )
}
