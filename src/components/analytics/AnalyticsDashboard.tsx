import { motion } from 'framer-motion'
import { GlobalKpi } from './GlobalKpi'
import { AnalyticsCharts } from './Charts'
import { EventsTable } from './EventsTable'

export function AnalyticsDashboard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      <GlobalKpi />
      <AnalyticsCharts />
      <EventsTable />
    </motion.div>
  )
}
