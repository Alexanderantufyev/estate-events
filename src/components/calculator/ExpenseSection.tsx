import type { ExpenseData } from '../../types'
import { Input } from '../ui/Input'
import { formatCurrency } from '../../utils/formatters'
import { calculateExpenses } from '../../utils/calculations'
import { TrendingDown } from 'lucide-react'

interface ExpenseSectionProps {
  data: ExpenseData
  onChange: (field: keyof ExpenseData, value: number) => void
  readOnly?: boolean
}

const FIELDS: { key: keyof ExpenseData; label: string }[] = [
  { key: 'venue', label: 'Аренда площадки' },
  { key: 'advertising', label: 'Реклама' },
  { key: 'staff', label: 'Зарплаты персонала' },
  { key: 'artists', label: 'Артисты / Спикеры' },
  { key: 'equipment', label: 'Оборудование' },
  { key: 'catering', label: 'Кейтеринг' },
  { key: 'transport', label: 'Транспорт' },
  { key: 'taxes', label: 'Налоги' },
  { key: 'other', label: 'Прочие расходы' },
]

export function ExpenseSection({ data, onChange, readOnly = false }: ExpenseSectionProps) {
  const total = calculateExpenses(data)

  const breakdown = FIELDS.map(({ key, label }) => ({
    label,
    value: data[key] as number,
    pct: total > 0 ? ((data[key] as number) / total) * 100 : 0,
  })).filter((f) => f.value > 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-500/15 flex items-center justify-center">
            <TrendingDown size={12} className="text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Расходы</h3>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400 dark:text-slate-500">Итого</p>
          <p className="text-base font-bold text-red-600 dark:text-red-400">
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FIELDS.map(({ key, label }) => (
          <div key={key}>
            {readOnly ? (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</label>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {formatCurrency(data[key] as number)}
                </p>
              </div>
            ) : (
              <Input
                label={label}
                type="number"
                min="0"
                value={(data[key] as number) || ''}
                onChange={(e) => onChange(key, parseFloat(e.target.value) || 0)}
                placeholder="0"
                prefix="₽"
              />
            )}
          </div>
        ))}
      </div>

      {breakdown.length > 0 && (
        <div className="space-y-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Структура расходов</p>
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 w-36 truncate">{item.label}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-red-400 dark:bg-red-500 transition-all"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 w-12 text-right">
                {item.pct.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 px-4 py-3 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Общие расходы</span>
          <span className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  )
}
