import { CalendarDays, BarChart3, Moon, Sun, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '../../utils/cn'
import { useEventStore } from '../../store/eventStore'

export function Sidebar() {
  const { isDarkMode, toggleDarkMode, isAnalyticsView, setIsAnalyticsView } =
    useEventStore()

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 glass border-r border-slate-200/60 dark:border-slate-700/60">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pomor-400 to-pomor-600 flex items-center justify-center shadow-lg shadow-pomor-500/30">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">
            Усадьба
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Event Manager
          </p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Навигация
        </p>
        <NavItem
          icon={<CalendarDays size={16} />}
          label="Календарь"
          active={!isAnalyticsView}
          onClick={() => setIsAnalyticsView(false)}
        />
        <NavItem
          icon={<BarChart3 size={16} />}
          label="Аналитика"
          active={isAnalyticsView}
          onClick={() => setIsAnalyticsView(true)}
        />
      </nav>

      <div className="px-3 py-4 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {isDarkMode ? (
            <>
              <Sun size={16} className="text-amber-400" />
              <span>Светлая тема</span>
            </>
          ) : (
            <>
              <Moon size={16} />
              <span>Тёмная тема</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}

function NavItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'sidebar-link w-full relative',
        active && 'active'
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active"
          className="absolute inset-0 bg-pomor-50 dark:bg-pomor-500/10 rounded-xl"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
      <span className="relative flex items-center gap-3">
        {icon}
        {label}
      </span>
    </button>
  )
}
