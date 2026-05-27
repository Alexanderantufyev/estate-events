import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEventStore } from '../../store/eventStore'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'
import type { RevenueData, ExpenseData, EventType } from '../../types'
import {
  DEFAULT_REVENUE,
  DEFAULT_EXPENSES,
  EVENT_TYPE_LABELS,
  PROFITABILITY_LABELS,
} from '../../types'

interface DayCalcPanelProps {
  date: string | null
  onClose: () => void
}

const MONTH_NAMES = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

function formatDateRu(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`
}

function NumInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 block">{label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        min="0"
        className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
      />
    </div>
  )
}

export function DayCalcPanel({ date, onClose }: DayCalcPanelProps) {
  const { getEventsForDate, addEvent, setSelectedEventId } = useEventStore()

  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('other')
  const [revenue, setRevenue] = useState<RevenueData>(DEFAULT_REVENUE)
  const [expenses, setExpenses] = useState<ExpenseData>(DEFAULT_EXPENSES)

  useEffect(() => {
    setTitle('')
    setType('other')
    setRevenue({ ...DEFAULT_REVENUE })
    setExpenses({ ...DEFAULT_EXPENSES })
  }, [date])

  const dayEvents = useMemo(
    () => (date ? getEventsForDate(date) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [date, getEventsForDate]
  )

  const metrics = useMemo(() => calculateMetrics(revenue, expenses), [revenue, expenses])

  const setRev = (field: keyof RevenueData, v: string) =>
    setRevenue((prev) => ({ ...prev, [field]: parseFloat(v) || 0 }))

  const setExp = (field: keyof ExpenseData, v: string) =>
    setExpenses((prev) => ({ ...prev, [field]: parseFloat(v) || 0 }))

  const handleSave = () => {
    if (!date) return
    const id = addEvent({
      title: title.trim() || 'Мероприятие',
      date,
      time: '12:00',
      endTime: '18:00',
      location: '',
      organizer: '',
      type,
      status: 'planned',
      comment: '',
      revenue,
      expenses,
    })
    setTitle('')
    setRevenue({ ...DEFAULT_REVENUE })
    setExpenses({ ...DEFAULT_EXPENSES })
    toast.success('Мероприятие добавлено')
    setSelectedEventId(id)
    onClose()
  }

  const profitColor =
    metrics.profitability === 'profitable'
      ? { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40' }
      : metrics.profitability === 'loss'
      ? { text: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40' }
      : { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40' }

  const hasAnyData =
    metrics.totalRevenue > 0 || metrics.totalExpenses > 0

  return (
    <AnimatePresence>
      {date && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-white dark:bg-slate-900 z-50 shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
                  Финансовый расчёт
                </p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {formatDateRu(date)}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Existing events */}
              {dayEvents.length > 0 && (
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                    Мероприятия в этот день · {dayEvents.length}
                  </p>
                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const m = calculateMetrics(event.revenue, event.expenses)
                      const isProfit = m.profitability === 'profitable'
                      const isLoss = m.profitability === 'loss'
                      return (
                        <button
                          key={event.id}
                          onClick={() => { setSelectedEventId(event.id); onClose() }}
                          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                              {event.title}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {EVENT_TYPE_LABELS[event.type]} · {PROFITABILITY_LABELS[m.profitability]}
                            </p>
                          </div>
                          <div className={`text-sm font-bold ml-3 flex-shrink-0 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : isLoss ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {formatCurrency(m.netProfit)}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quick calculator */}
              <div className="px-5 py-4 space-y-5">
                <div className="flex items-center gap-2">
                  <Plus size={14} className="text-slate-400" />
                  <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Новый расчёт
                  </p>
                </div>

                {/* Live KPI — показывается только когда есть данные */}
                <div className={`rounded-xl p-4 border transition-all ${hasAnyData ? profitColor.bg : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'}`}>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">Прибыль</p>
                      <p className={`text-sm font-bold mt-1 ${hasAnyData ? profitColor.text : 'text-slate-400'}`}>
                        {hasAnyData ? formatCurrency(metrics.netProfit) : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">ROI</p>
                      <p className={`text-sm font-bold mt-1 ${hasAnyData ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                        {hasAnyData ? `${metrics.roi.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">Маржа</p>
                      <p className={`text-sm font-bold mt-1 ${hasAnyData ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
                        {hasAnyData ? `${metrics.margin.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                  </div>
                  {hasAnyData && metrics.breakeven > 0 && (
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                      Точка безубыточности: {metrics.breakeven} билетов
                    </p>
                  )}
                </div>

                {/* Name + type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 block">Название</label>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Название мероприятия"
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 block">Тип</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as EventType)}
                      className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all"
                    >
                      {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Revenue */}
                <div>
                  <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-2">
                    Доходы
                  </p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <NumInput label="Цена билета, ₽" value={revenue.ticketPrice} onChange={(v) => setRev('ticketPrice', v)} />
                      <NumInput label="Продано билетов" value={revenue.ticketsSold} onChange={(v) => setRev('ticketsSold', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumInput label="Спонсоры" value={revenue.sponsors} onChange={(v) => setRev('sponsors', v)} />
                      <NumInput label="Бар" value={revenue.bar} onChange={(v) => setRev('bar', v)} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <NumInput label="Мерч" value={revenue.merch} onChange={(v) => setRev('merch', v)} />
                      <NumInput label="Прочие доходы" value={revenue.additionalIncome} onChange={(v) => setRev('additionalIncome', v)} />
                    </div>
                    {revenue.ticketPrice > 0 && revenue.ticketsSold > 0 && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 text-right">
                        Билеты: {formatCurrency(revenue.ticketPrice * revenue.ticketsSold)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Expenses */}
                <div>
                  <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">
                    Расходы
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <NumInput label="Площадка" value={expenses.venue} onChange={(v) => setExp('venue', v)} />
                    <NumInput label="Реклама" value={expenses.advertising} onChange={(v) => setExp('advertising', v)} />
                    <NumInput label="Персонал" value={expenses.staff} onChange={(v) => setExp('staff', v)} />
                    <NumInput label="Артисты" value={expenses.artists} onChange={(v) => setExp('artists', v)} />
                    <NumInput label="Оборудование" value={expenses.equipment} onChange={(v) => setExp('equipment', v)} />
                    <NumInput label="Кейтеринг" value={expenses.catering} onChange={(v) => setExp('catering', v)} />
                    <NumInput label="Транспорт" value={expenses.transport} onChange={(v) => setExp('transport', v)} />
                    <NumInput label="Налоги" value={expenses.taxes} onChange={(v) => setExp('taxes', v)} />
                    <NumInput label="Прочие расходы" value={expenses.other} onChange={(v) => setExp('other', v)} />
                  </div>
                </div>

                {/* Save */}
                <button
                  onClick={handleSave}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
                >
                  <Check size={15} />
                  Сохранить мероприятие
                </button>

                <div className="h-4" />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
