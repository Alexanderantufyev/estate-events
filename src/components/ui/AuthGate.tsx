import { useState, useEffect } from 'react'
import { useEventStore } from '../../store/eventStore'

type Status = 'loading' | 'authenticated' | 'unauthenticated'

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading')
  const loadEvents = useEventStore((s) => s.loadEvents)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setStatus('authenticated')
          loadEvents()
        } else {
          setStatus('unauthenticated')
        }
      })
      .catch(() => setStatus('unauthenticated'))
  }, [loadEvents])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setStatus('authenticated')
        loadEvents()
      } else {
        setError('Неверный пароль')
        setPassword('')
      }
    } catch {
      setError('Нет связи с сервером')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-7 h-7 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mb-4">
              <span className="text-2xl">🏛</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Venue OS</h1>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">Усадьба</p>
          </div>

          <form
            onSubmit={submit}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-700 space-y-4"
          >
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError('') }}
                autoFocus
                placeholder="••••"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-sm transition-all"
              />
              {error && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1.5">{error}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={submitting || !password}
              className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
            >
              {submitting ? 'Проверка...' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
