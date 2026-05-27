import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts'
import { useEventStore } from '../../store/eventStore'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency, formatDateShort } from '../../utils/formatters'

const STATUS_COLORS: Record<string, string> = {
  planned: '#3b82f6',
  confirmed: '#22c55e',
  completed: '#8b5cf6',
  cancelled: '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: { value: number; name: string; color?: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-card px-3 py-2.5 text-xs shadow-xl min-w-[120px]">
      {label && <p className="font-semibold text-slate-600 dark:text-slate-300 mb-2">{label}</p>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-slate-500 dark:text-slate-400">{p.name}</span>
          <span className="font-bold" style={{ color: p.color }}>
            {typeof p.value === 'number' && p.value > 1000
              ? formatCurrency(p.value)
              : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export function AnalyticsCharts() {
  const { getFilteredEvents } = useEventStore()
  const events = getFilteredEvents()

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))

  const barData = sorted.slice(0, 12).map((e) => {
    const m = calculateMetrics(e.revenue, e.expenses)
    return {
      name: e.title.length > 12 ? e.title.slice(0, 12) + '…' : e.title,
      date: formatDateShort(e.date),
      Доход: m.totalRevenue,
      Расход: m.totalExpenses,
      Прибыль: m.netProfit,
    }
  })

  const lineData = sorted.map((e) => {
    const m = calculateMetrics(e.revenue, e.expenses)
    return {
      name: formatDateShort(e.date),
      ROI: parseFloat(m.roi.toFixed(1)),
      Прибыль: m.netProfit,
    }
  })

  const statusCount: Record<string, number> = {}
  events.forEach((e) => {
    statusCount[e.status] = (statusCount[e.status] || 0) + 1
  })
  const pieData = Object.entries(statusCount).map(([status, value]) => ({
    name: STATUS_LABELS[status] || status,
    value,
    color: STATUS_COLORS[status] || '#94a3b8',
  }))

  const axisStyle = { fontSize: 10, fill: '#94a3b8' }
  const gridStyle = { stroke: '#e2e8f0', strokeDasharray: '3 3', opacity: 0.5 }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card p-5">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Доходы и расходы по мероприятиям
        </p>
        {barData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barGap={2} barSize={20}>
              <CartesianGrid vertical={false} {...gridStyle} />
              <XAxis dataKey="date" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}М` : v >= 1000 ? `${(v / 1000).toFixed(0)}К` : `${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Доход" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Расход" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-card p-5">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Статусы мероприятий
        </p>
        {pieData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, _i) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, name: string) => [v, name]}
                contentStyle={{ borderRadius: '12px', border: 'none', fontSize: 12 }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-card p-5 lg:col-span-2">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Динамика прибыли
        </p>
        {lineData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="name" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}М` : v >= 1000 ? `${(v / 1000).toFixed(0)}К` : `${v}`}
              />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="Прибыль"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="ROI"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3, fill: '#f59e0b' }}
                strokeDasharray="5 3"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[220px] flex items-center justify-center text-sm text-slate-400 dark:text-slate-500">
      Нет данных для отображения
    </div>
  )
}
