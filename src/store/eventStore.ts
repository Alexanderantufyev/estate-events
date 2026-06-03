import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { v4 as uuid } from '../utils/uuid'
import type { EventItem, FilterState, CalendarView } from '../types'

// Debounced sync to server — only the last mutation within 400ms triggers a write
let syncTimer: ReturnType<typeof setTimeout> | null = null

function scheduleSync(events: EventItem[]) {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    fetch('/api/events', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
    }).catch((err) => console.error('Sync failed:', err))
  }, 400)
}

interface EventStore {
  events: EventItem[]
  filters: FilterState
  currentView: CalendarView
  currentDate: string
  isDarkMode: boolean
  selectedEventId: string | null
  isCreateModalOpen: boolean
  isAnalyticsView: boolean
  selectedCalendarDate: string | null
  isLoading: boolean

  loadEvents: () => Promise<void>
  addEvent: (event: Omit<EventItem, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateEvent: (id: string, updates: Partial<EventItem>) => void
  deleteEvent: (id: string) => void
  duplicateEvent: (id: string) => void

  setView: (view: CalendarView) => void
  setCurrentDate: (date: string) => void
  setSelectedEventId: (id: string | null) => void
  setIsCreateModalOpen: (open: boolean) => void
  setIsAnalyticsView: (v: boolean) => void
  setSelectedCalendarDate: (date: string | null) => void

  setFilters: (filters: Partial<FilterState>) => void
  clearFilters: () => void

  toggleDarkMode: () => void

  getFilteredEvents: () => EventItem[]
  getEventById: (id: string) => EventItem | undefined
  getEventsForDate: (date: string) => EventItem[]
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  status: 'all',
  type: 'all',
  dateFrom: '',
  dateTo: '',
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],
      filters: DEFAULT_FILTERS,
      currentView: 'month',
      currentDate: new Date().toISOString().slice(0, 10),
      isDarkMode: false,
      selectedEventId: null,
      isCreateModalOpen: false,
      isAnalyticsView: false,
      selectedCalendarDate: null,
      isLoading: false,

      loadEvents: async () => {
        set({ isLoading: true })
        try {
          const res = await fetch('/api/events')
          const data = await res.json() as { events?: EventItem[]; error?: string }
          if (data.error) console.error('API error:', data.error)
          set({ events: data.events ?? [], isLoading: false })
        } catch (err) {
          console.error('Failed to load events:', err)
          set({ isLoading: false })
        }
      },

      addEvent: (eventData) => {
        const id = uuid()
        const now = new Date().toISOString()
        const event: EventItem = { ...eventData, id, createdAt: now, updatedAt: now }
        const events = [...get().events, event]
        set({ events })
        scheduleSync(events)
        return id
      },

      updateEvent: (id, updates) => {
        const events = get().events.map((e) =>
          e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e
        )
        set({ events })
        scheduleSync(events)
      },

      deleteEvent: (id) => {
        const state = get()
        const events = state.events.filter((e) => e.id !== id)
        set({
          events,
          selectedEventId: state.selectedEventId === id ? null : state.selectedEventId,
        })
        scheduleSync(events)
      },

      duplicateEvent: (id) => {
        const event = get().events.find((e) => e.id === id)
        if (!event) return
        const now = new Date().toISOString()
        const newEvent: EventItem = {
          ...event,
          id: uuid(),
          title: `${event.title} (копия)`,
          status: 'planned',
          createdAt: now,
          updatedAt: now,
        }
        const events = [...get().events, newEvent]
        set({ events })
        scheduleSync(events)
      },

      setView: (view) => set({ currentView: view }),
      setCurrentDate: (date) => set({ currentDate: date }),
      setSelectedEventId: (id) => set({ selectedEventId: id }),
      setIsCreateModalOpen: (open) => set({ isCreateModalOpen: open }),
      setIsAnalyticsView: (v) => set({ isAnalyticsView: v }),
      setSelectedCalendarDate: (date) => set({ selectedCalendarDate: date }),

      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),

      clearFilters: () => set({ filters: DEFAULT_FILTERS }),

      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

      getFilteredEvents: () => {
        const { events, filters } = get()
        return events.filter((event) => {
          if (
            filters.search &&
            !event.title.toLowerCase().includes(filters.search.toLowerCase()) &&
            !event.location.toLowerCase().includes(filters.search.toLowerCase()) &&
            !event.organizer.toLowerCase().includes(filters.search.toLowerCase())
          )
            return false
          if (filters.status !== 'all' && event.status !== filters.status) return false
          if (filters.type !== 'all' && event.type !== filters.type) return false
          if (filters.dateFrom && event.date < filters.dateFrom) return false
          if (filters.dateTo && event.date > filters.dateTo) return false
          return true
        })
      },

      getEventById: (id) => get().events.find((e) => e.id === id),

      getEventsForDate: (date) => get().events.filter((e) => e.date === date),
    }),
    {
      name: 'estate-events-ui',
      storage: createJSONStorage(() => localStorage),
      // Only persist UI preferences — events live on the server
      partialize: (state) => ({
        isDarkMode: state.isDarkMode,
        currentView: state.currentView,
      }),
    }
  )
)
