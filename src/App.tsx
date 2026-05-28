import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Layout } from './components/layout/Layout'
import { CalendarPage } from './components/calendar/CalendarPage'
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard'
import { AuthGate } from './components/ui/AuthGate'
import { useEventStore } from './store/eventStore'

export default function App() {
  const isDarkMode = useEventStore((s) => s.isDarkMode)
  const isAnalyticsView = useEventStore((s) => s.isAnalyticsView)
  const isLoading = useEventStore((s) => s.isLoading)
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

  if (isLoading) {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <AuthGate>
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
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#ffffff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
          },
        }}
      />
    </AuthGate>
  )
}
