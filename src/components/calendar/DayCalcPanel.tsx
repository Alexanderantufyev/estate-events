import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Check, Trash2, Clock, User, Phone, ListChecks, BarChart2, Megaphone } from 'lucide-react'
import toast from 'react-hot-toast'
import { useEventStore } from '../../store/eventStore'
import { calculateMetrics } from '../../utils/calculations'
import { formatCurrency } from '../../utils/formatters'
import type { RevenueData, ExpenseData, EventType, TaskItem, TimelineItem, SmmPost } from '../../types'
import {
  DEFAULT_REVENUE,
  DEFAULT_EXPENSES,
  EVENT_TYPE_LABELS,
  PROFITABILITY_LABELS,
  VENUE_ZONES,
} from '../../types'
import { SmmTab } from './SmmTab'

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

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
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

function TextInput({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; icon?: React.ReactNode
}) {
  return (
    <div>
      <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5 block">{label}</label>
      <div className="relative">
        {icon && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition-all ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`}
        />
      </div>
    </div>
  )
}

type Tab = 'finance' | 'tasks' | 'timeline' | 'smm'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'finance', label: 'Финансы', icon: <BarChart2 size={13} /> },
  { key: 'tasks', label: 'Задачи', icon: <ListChecks size={13} /> },
  { key: 'timeline', label: 'Тайминг', icon: <Clock size={13} /> },
  { key: 'smm', label: 'СММ', icon: <Megaphone size={13} /> },
]

function newTask(): TaskItem {
  return { id: crypto.randomUUID(), title: '', assignee: '', contact: '', done: false }
}

function newTimelineItem(): TimelineItem {
  return { id: crypto.randomUUID(), time: '', title: '' }
}

export function DayCalcPanel({ date, onClose }: DayCalcPanelProps) {
  const events = useEventStore((s) => s.events)
  const addEvent = useEventStore((s) => s.addEvent)
  const deleteEvent = useEventStore((s) => s.deleteEvent)
  const setSelectedEventId = useEventStore((s) => s.setSelectedEventId)

  const [tab, setTab] = useState<Tab>('finance')
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('other')
  const [venueZones, setVenueZones] = useState<string[]>([])
  const [revenue, setRevenue] = useState<RevenueData>({ ...DEFAULT_REVENUE })
  const [expenses, setExpenses] = useState<ExpenseData>({ ...DEFAULT_EXPENSES })
  const [tasks, setTasks] = useState<TaskItem[]>([newTask()])
  const [timeline, setTimeline] = useState<TimelineItem[]>([newTimelineItem()])
  const [posts, setPosts] = useState<SmmPost[]>([])

  useEffect(() => {
    setTab('finance')
    setTitle('')
    setType('other')
    setVenueZones([])
    setRevenue({ ...DEFAULT_REVENUE })
    setExpenses({ ...DEFAULT_EXPENSES })
    setTasks([newTask()])
    setTimeline([newTimelineItem()])
    setPosts([])
  }, [date])

  const dayEvents = useMemo(
    () => (date ? events.filter((e) => e.date === date) : []),
    [date, events]
  )

  const metrics = useMemo(() => calculateMetrics(revenue, expenses), [revenue, expenses])

  const setRev = (field: keyof RevenueData, v: string) =>
    setRevenue((prev) => ({ ...prev, [field]: parseFloat(v) || 0 }))

  const setExp = (field: keyof ExpenseData, v: string) =>
    setExpenses((prev) => ({ ...prev, [field]: parseFloat(v) || 0 }))

  const updateTask = (id: string, field: keyof TaskItem, value: string | boolean) =>
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t))

  const removeTask = (id: string) =>
    setTasks((prev) => prev.filter((t) => t.id !== id))

  const updateTimeline = (id: string, field: keyof TimelineItem, value: string) =>
    setTimeline((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t))

  const removeTimelineItem = (id: string) =>
    setTimeline((prev) => prev.filter((t) => t.id !== id))

  const handleSave = () => {
    if (!date) return
    const cleanTasks = tasks.filter((t) => t.title.trim())
    const cleanTimeline = timeline
      .filter((t) => t.title.trim())
      .sort((a, b) => a.time.localeCompare(b.time))
    addEvent({
      title: title.trim() || 'Мероприятие',
      date,
      time: cleanTimeline[0]?.time || '12:00',
      endTime: cleanTimeline[cleanTimeline.length - 1]?.time || '18:00',
      location: '',
      organizer: '',
      type,
      status: 'planned',
      comment: '',
      revenue,
      expenses,
      tasks: cleanTasks,
      timeline: cleanTimeline,
      posts,
      venueZones,
    })
    toast.success('Мероприятие добавлено')
    onClose()
  }

  const hasAnyData = metrics.totalRevenue > 0 || metrics.totalExpenses > 0

  const profitColor =
    metrics.profitability === 'profitable'
      ? { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/40' }
      : metrics.profitability === 'loss'
      ? { text: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40' }
      : { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40' }

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
            className="fixed right-0 top-0 h-full w-[440px] bg-white dark:bg-slate-900 z-50 shadow-2xl shadow-black/20 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Планирование дня</p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{formatDateRu(date)}</h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 mt-0.5">
                <X size={16} />
              </button>
            </div>

            {/* Existing events */}
            {dayEvents.length > 0 && (
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Уже запланировано · {dayEvents.length}
                </p>
                <div className="space-y-1.5">
                  {dayEvents.map((event) => {
                    const m = calculateMetrics(event.revenue, event.expenses)
                    const isProfit = m.profitability === 'profitable'
                    const isLoss = m.profitability === 'loss'
                    return (
                      <div
                        key={event.id}
                        className="flex items-center rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <button
                          onClick={() => { onClose(); setSelectedEventId(event.id) }}
                          className="flex-1 flex items-center justify-between px-3 py-2 text-left min-w-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{event.title}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{EVENT_TYPE_LABELS[event.type]} · {PROFITABILITY_LABELS[m.profitability]}</p>
                          </div>
                          <div className={`text-sm font-bold ml-3 flex-shrink-0 ${isProfit ? 'text-emerald-600 dark:text-emerald-400' : isLoss ? 'text-red-500 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                            {formatCurrency(m.netProfit)}
                          </div>
                        </button>
                        <button
                          onClick={() => { deleteEvent(event.id); toast.success('Мероприятие удалено') }}
                          className="p-2 mr-1.5 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 rounded-lg transition-colors flex-shrink-0"
                          title="Удалить мероприятие"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Name + type row */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <TextInput label="Название" value={title} onChange={setTitle} placeholder="Название мероприятия" />
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
              <div>
                <label className="text-[10px] text-slate-400 dark:text-slate-500 mb-1.5 block">Локации</label>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {VENUE_ZONES.map((zone) => (
                    <label key={zone} className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={venueZones.includes(zone)}
                        onChange={(e) =>
                          setVenueZones((prev) =>
                            e.target.checked ? [...prev, zone] : prev.filter((z) => z !== zone)
                          )
                        }
                        className="w-3.5 h-3.5 rounded accent-emerald-500"
                      />
                      <span className="text-xs text-slate-700 dark:text-slate-300">{zone}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pt-3 flex-shrink-0">
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                      tab === t.key
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">

              {/* FINANCE TAB */}
              {tab === 'finance' && (
                <div className="space-y-5">
                  {/* Live KPI */}
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

                  <div>
                    <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500 uppercase tracking-wider mb-2">Доходы</p>
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

                  <div>
                    <p className="text-[10px] font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">Расходы</p>
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
                </div>
              )}

              {/* TASKS TAB */}
              {tab === 'tasks' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Добавьте задачи, ответственных и их контакты
                  </p>
                  {tasks.map((task, idx) => (
                    <div key={task.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2 relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Задача {idx + 1}</span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={(e) => updateTask(task.id, 'done', e.target.checked)}
                              className="w-3.5 h-3.5 rounded accent-emerald-500"
                            />
                            <span className="text-[10px] text-slate-400">Выполнено</span>
                          </label>
                          {tasks.length > 1 && (
                            <button onClick={() => removeTask(task.id)} className="p-1 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-colors rounded">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      <TextInput
                        label="Название задачи"
                        value={task.title}
                        onChange={(v) => updateTask(task.id, 'title', v)}
                        placeholder="Что нужно сделать"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <TextInput
                          label="Ответственный"
                          value={task.assignee}
                          onChange={(v) => updateTask(task.id, 'assignee', v)}
                          placeholder="Имя"
                          icon={<User size={11} />}
                        />
                        <TextInput
                          label="Контакт"
                          value={task.contact}
                          onChange={(v) => updateTask(task.id, 'contact', v)}
                          placeholder="+7 или email"
                          icon={<Phone size={11} />}
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setTasks((prev) => [...prev, newTask()])}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-400 text-xs font-medium rounded-xl transition-colors"
                  >
                    <Plus size={13} /> Добавить задачу
                  </button>
                </div>
              )}

              {/* TIMELINE TAB */}
              {tab === 'timeline' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">
                    Постройте тайминг мероприятия по шагам
                  </p>
                  <div className="relative">
                    {/* vertical line */}
                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="space-y-3">
                      {timeline.map((item, idx) => (
                        <div key={item.id} className="flex gap-3 items-start">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center z-10">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{idx + 1}</span>
                          </div>
                          <div className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-2">
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                              <div>
                                <label className="text-[10px] text-slate-400 mb-0.5 block">Время</label>
                                <input
                                  type="time"
                                  value={item.time}
                                  onChange={(e) => updateTimeline(item.id, 'time', e.target.value)}
                                  className="w-full px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
                                />
                              </div>
                              <TextInput
                                label="Событие"
                                value={item.title}
                                onChange={(v) => updateTimeline(item.id, 'title', v)}
                                placeholder="Что происходит"
                              />
                            </div>
                          </div>
                          {timeline.length > 1 && (
                            <button onClick={() => removeTimelineItem(item.id)} className="mt-2.5 p-1.5 text-slate-300 hover:text-red-400 dark:text-slate-600 dark:hover:text-red-400 transition-colors rounded-lg">
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setTimeline((prev) => [...prev, newTimelineItem()])}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-400 text-xs font-medium rounded-xl transition-colors"
                  >
                    <Plus size={13} /> Добавить шаг
                  </button>
                </div>
              )}

              {/* SMM TAB */}
              {tab === 'smm' && (
                <div className="space-y-3">
                  {dayEvents.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Посты сохранённых мероприятий
                      </p>
                      {dayEvents.map((ev) => {
                        const evPosts = ev.posts ?? []
                        return (
                          <button
                            key={ev.id}
                            onClick={() => { onClose(); setSelectedEventId(ev.id) }}
                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{ev.title}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {evPosts.length > 0
                                  ? `${evPosts.length} пост${evPosts.length === 1 ? '' : evPosts.length < 5 ? 'а' : 'ов'}`
                                  : 'Постов нет'}
                              </p>
                            </div>
                            <span className="text-[10px] text-emerald-500 font-medium ml-3 flex-shrink-0">
                              Открыть →
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  <div>
                    {dayEvents.length > 0 && (
                      <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                        Пост для нового мероприятия
                      </p>
                    )}
                    <SmmTab posts={posts} onChange={setPosts} />
                  </div>
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                className="w-full flex items-center justify-center gap-2 py-3 mt-5 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-emerald-500/25"
              >
                <Check size={15} />
                Сохранить мероприятие
              </button>
              <div className="h-4" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
