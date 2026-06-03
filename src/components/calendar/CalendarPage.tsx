import { AnimatePresence, motion } from 'framer-motion'
import { MonthView } from './MonthView'
import { WeekView } from './WeekView'
import { DayView } from './DayView'
import { DayCalcPanel } from './DayCalcPanel'
import { EventModal } from '../events/EventModal'
import { CreateEventModal } from '../events/EventForm'
import { useEventStore } from '../../store/eventStore'

export function CalendarPage() {
  const {
    currentView,
    selectedEventId,
    isCreateModalOpen,
    selectedCalendarDate,
    isLoading,
    setSelectedEventId,
    setIsCreateModalOpen,
    setSelectedCalendarDate,
  } = useEventStore()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {currentView === 'month' && <MonthView />}
          {currentView === 'week' && <WeekView />}
          {currentView === 'day' && <DayView />}
        </motion.div>
      </AnimatePresence>

      <DayCalcPanel
        date={selectedCalendarDate}
        onClose={() => setSelectedCalendarDate(null)}
      />

      <EventModal
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
      />

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
