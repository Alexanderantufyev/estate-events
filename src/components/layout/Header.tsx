import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Download,
  FileSpreadsheet,
  CalendarDays,
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '../ui/Button'
import { IcsImportModal } from '../ui/IcsImportModal'
import { useEventStore } from '../../store/eventStore'
import { formatMonthYear } from '../../utils/formatters'
import { exportToCSV, exportToExcel } from '../../utils/export'
import toast from 'react-hot-toast'
import {
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  parseISO,
} from 'date-fns'

type CalendarView = 'month' | 'week' | 'day'

const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Месяц',
  week: 'Неделя',
  day: 'День',
}

export function Header() {
  const {
    currentView,
    currentDate,
    isDarkMode,
    isAnalyticsView,
    filters,
    toggleDarkMode,
    setView,
    setCurrentDate,
    setIsCreateModalOpen,
    setFilters,
    setIsAnalyticsView,
    getFilteredEvents,
  } = useEventStore()

  const [exportLoading, setExportLoading] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const date = parseISO(currentDate)

  const navigate = (dir: 'prev' | 'next') => {
    let newDate: Date
    const offset = dir === 'prev' ? -1 : 1
    if (currentView === 'month') {
      newDate = offset > 0 ? addMonths(date, 1) : subMonths(date, 1)
    } else if (currentView === 'week') {
      newDate = offset > 0 ? addWeeks(date, 1) : subWeeks(date, 1)
    } else {
      newDate = offset > 0 ? addDays(date, 1) : subDays(date, 1)
    }
    setCurrentDate(newDate.toISOString().slice(0, 10))
  }

  const goToday = () => setCurrentDate(new Date().toISOString().slice(0, 10))

  const handleExportCSV = () => {
    const events = getFilteredEvents()
    if (!events.length) {
      toast.error('Нет мероприятий для экспорта')
      return
    }
    exportToCSV(events)
    toast.success(`Экспортировано ${events.length} мероприятий`)
  }

  const handleExportExcel = async () => {
    const events = getFilteredEvents()
    if (!events.length) {
      toast.error('Нет мероприятий для экспорта')
      return
    }
    setExportLoading(true)
    try {
      await exportToExcel(events)
      toast.success(`Экспортировано ${events.length} мероприятий`)
    } catch {
      toast.error('Ошибка при экспорте')
    } finally {
      setExportLoading(false)
    }
  }

  return (
    <>
    <header className="sticky top-0 z-30 glass border-b border-slate-200/60 dark:border-slate-700/60">
      <div className="flex items-center gap-3 px-4 lg:px-6 h-16">
        <div className="flex lg:hidden items-center gap-2 mr-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">У</span>
          </div>
        </div>

        {!isAnalyticsView && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('prev')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goToday}
              className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors min-w-[140px] text-center"
            >
              {formatMonthYear(date)}
            </button>
            <button
              onClick={() => navigate('next')}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {isAnalyticsView && (
          <h1 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            Финансовая аналитика
          </h1>
        )}

        <div className="flex-1" />

        <div className="relative hidden md:block">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Поиск мероприятий..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 w-52 transition-all focus:w-64"
          />
        </div>

        {!isAnalyticsView && (
          <div className="hidden sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            {(['month', 'week', 'day'] as CalendarView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  currentView === v
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExportCSV}
            title="Экспорт CSV"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hidden sm:flex"
          >
            <Download size={15} />
          </button>
          <button
            onClick={handleExportExcel}
            disabled={exportLoading}
            title="Экспорт Excel"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hidden sm:flex disabled:opacity-50"
          >
            <FileSpreadsheet size={15} />
          </button>

          <button
            onClick={() => setIsImportOpen(true)}
            title="Импорт из Google Календаря (.ics)"
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors hidden sm:flex items-center gap-1.5"
          >
            <CalendarDays size={15} />
            <span className="hidden lg:inline text-xs font-medium">Google Календарь</span>
          </button>

          <div className="hidden lg:block">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {isDarkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>

          <Button
            onClick={() => {
              setIsAnalyticsView(false)
              setIsCreateModalOpen(true)
            }}
            size="sm"
            className="gap-1.5"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">Создать</span>
          </Button>
        </div>
      </div>

      {!isAnalyticsView && (
        <div className="flex items-center gap-2 px-4 lg:px-6 pb-3 overflow-x-auto no-scrollbar">
          <FilterChip
            label="Все статусы"
            value="all"
            current={filters.status}
            onClick={() => setFilters({ status: 'all' })}
          />
          <FilterChip
            label="Запланировано"
            value="planned"
            current={filters.status}
            onClick={() => setFilters({ status: 'planned' })}
            color="bg-blue-500"
          />
          <FilterChip
            label="Подтверждено"
            value="confirmed"
            current={filters.status}
            onClick={() => setFilters({ status: 'confirmed' })}
            color="bg-emerald-500"
          />
          <FilterChip
            label="Завершено"
            value="completed"
            current={filters.status}
            onClick={() => setFilters({ status: 'completed' })}
            color="bg-purple-500"
          />
          <FilterChip
            label="Отменено"
            value="cancelled"
            current={filters.status}
            onClick={() => setFilters({ status: 'cancelled' })}
            color="bg-red-500"
          />

          {(filters.status !== 'all' || filters.search || filters.type !== 'all') && (
            <button
              onClick={() => useEventStore.getState().clearFilters()}
              className="ml-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors whitespace-nowrap"
            >
              Сбросить
            </button>
          )}
        </div>
      )}
    </header>

    <IcsImportModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </>
  )
}

function FilterChip({
  label,
  value,
  current,
  onClick,
  color,
}: {
  label: string
  value: string
  current: string
  onClick: () => void
  color?: string
}) {
  const active = current === value
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
        active
          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
      }`}
    >
      {color && <span className={`w-1.5 h-1.5 rounded-full ${color}`} />}
      {label}
    </button>
  )
}
