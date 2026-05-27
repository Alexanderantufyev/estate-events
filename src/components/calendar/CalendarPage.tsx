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
    setSelectedEventId,
    setIsCreateModalOpen,
    setSelectedCalendarDate,
  } = useEventStore()

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
