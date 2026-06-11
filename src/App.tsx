import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/layout/Layout'
import { CalendarPage } from './components/calendar/CalendarPage'
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard'
import { useEventStore } from './store/eventStore'

export default function App() {
  const isDarkMode = useEventStore((s) => s.isDarkMode)
  const isAnalyticsView = useEventStore((s) => s.isAnalyticsView)
  const loadEvents = useEventStore((s) => s.loadEvents)

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return (
    <>
      <Layout>
        {isAnalyticsView ? <AnalyticsDashboard /> : <CalendarPage />}
      </Layout>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: isDarkMode ? '#1e293b' : '#ffffff',
            color: isDarkMode ? '#f1f5f9' : '#0f172a',
            border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            fontSize: '13px',
            fontWeight: 500,
          },
          success: { iconTheme: { primary: '#1B6255', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#B5171E', secondary: '#ffffff' } },
        }}
      />
    </>
  )
}
