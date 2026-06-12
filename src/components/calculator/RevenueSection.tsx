import type { RevenueData } from '../../types'
import { Input } from '../ui/Input'
import { formatCurrency } from '../../utils/formatters'
import { calculateRevenue } from '../../utils/calculations'
import { TrendingUp } from 'lucide-react'

interface RevenueSectionProps {
  data: RevenueData
  onChange: (field: keyof RevenueData, value: number) => void
  readOnly?: boolean
}

const FIELDS: { key: keyof RevenueData; label: string; hint?: string }[] = [
  { key: 'ticketPrice', label: 'Цена билета', hint: '₽/шт' },
  { key: 'ticketsSold', label: 'Продано билетов', hint: 'шт' },
  { key: 'sponsors', label: 'Чайная' },
  { key: 'additionalIncome', label: 'Дополнительный доход' },
  { key: 'bar', label: 'Бар / Еда' },
  { key: 'merch', label: 'Мерч' },
]

export function RevenueSection({ data, onChange, readOnly = false }: RevenueSectionProps) {
  const total = calculateRevenue(data)
  const ticketRevenue = data.ticketPrice * data.ticketsSold

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-pomor-100 dark:bg-pomor-500/15 flex items-center justify-center">
            <TrendingUp size={12} className="text-pomor-600 dark:text-pomor-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Доходы</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500">Итого</p>
          <p className="text-base font-bold text-pomor-600 dark:text-pomor-400">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      {data.ticketPrice > 0 && data.ticketsSold > 0 && (
        <div className="rounded-xl bg-pomor-50 dark:bg-pomor-500/10 px-3 py-2 text-xs text-pomor-700 dark:text-pomor-300">
          Доход с билетов: {formatCurrency(ticketRevenue)} ({data.ticketsSold} × {formatCurrency(data.ticketPrice)})
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label, hint }) => (
          <div key={key}>
            {readOnly ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {key === 'ticketsSold'
                    ? `${data[key]} шт`
                    : formatCurrency(data[key] as number)}
                </p>
              </div>
            ) : (
              <Input
                label={`${label}${hint ? ` (${hint})` : ''}`}
                type="number"
                min="0"
                value={data[key] || ''}
                onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
                placeholder="0"
                prefix={key !== 'ticketsSold' ? '₽' : undefined}
              />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Общий доход</span>
          <span className="text-lg font-bold text-pomor-600 dark:text-pomor-400">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
