export type EventStatus = 'planned' | 'confirmed' | 'completed' | 'cancelled'

export type EventType =
  | 'concert'
  | 'conference'
  | 'wedding'
  | 'corporate'
  | 'festival'
  | 'private'
  | 'exhibition'
  | 'other'

export type CalendarView = 'month' | 'week' | 'day'

export type Profitability = 'profitable' | 'loss' | 'risk'

export interface TaskItem {
  id: string
  title: string
  assignee: string
  contact: string
  done: boolean
}

export interface TimelineItem {
  id: string
  time: string
  title: string
}

export interface RevenueData {
  ticketPrice: number
  ticketsSold: number
  sponsors: number
  additionalIncome: number
  bar: number
  merch: number
}

export interface ExpenseData {
  venue: number
  advertising: number
  staff: number
  artists: number
  equipment: number
  catering: number
  transport: number
  taxes: number
  other: number
}

export interface EventItem {
  id: string
  title: string
  date: string
  time: string
  endTime: string
  location: string
  organizer: string
  type: EventType
  status: EventStatus
  comment: string
  revenue: RevenueData
  expenses: ExpenseData
  tasks: TaskItem[]
  timeline: TimelineItem[]
  createdAt: string
  updatedAt: string
}

export interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  roi: number
  margin: number
  breakeven: number
  profitPerAttendee: number
  profitability: Profitability
}

export interface FilterState {
  search: string
  status: EventStatus | 'all'
  type: EventType | 'all'
  dateFrom: string
  dateTo: string
}

export const STATUS_LABELS: Record<EventStatus, string> = {
  planned: 'Запланировано',
  confirmed: 'Подтверждено',
  completed: 'Завершено',
  cancelled: 'Отменено',
}

export const STATUS_COLORS: Record<EventStatus, string> = {
  planned: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  confirmed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

export const STATUS_DOT_COLORS: Record<EventStatus, string> = {
  planned: 'bg-blue-500',
  confirmed: 'bg-emerald-500',
  completed: 'bg-purple-500',
  cancelled: 'bg-red-500',
}

export const STATUS_CHIP_COLORS: Record<EventStatus, string> = {
  planned: 'bg-blue-500/90 text-white',
  confirmed: 'bg-emerald-500/90 text-white',
  completed: 'bg-purple-500/90 text-white',
  cancelled: 'bg-red-500/90 text-white',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  concert: 'Концерт',
  conference: 'Конференция',
  wedding: 'Свадьба',
  corporate: 'Корпоратив',
  festival: 'Фестиваль',
  private: 'Частное',
  exhibition: 'Выставка',
  other: 'Другое',
}

export const PROFITABILITY_COLORS: Record<Profitability, string> = {
  profitable: 'text-emerald-500',
  loss: 'text-red-500',
  risk: 'text-amber-500',
}

export const PROFITABILITY_BG: Record<Profitability, string> = {
  profitable: 'bg-emerald-500/10 border-emerald-500/20',
  loss: 'bg-red-500/10 border-red-500/20',
  risk: 'bg-amber-500/10 border-amber-500/20',
}

export const PROFITABILITY_LABELS: Record<Profitability, string> = {
  profitable: 'Прибыльное',
  loss: 'Убыточное',
  risk: 'Зона риска',
}

export const DEFAULT_REVENUE: RevenueData = {
  ticketPrice: 0,
  ticketsSold: 0,
  sponsors: 0,
  additionalIncome: 0,
  bar: 0,
  merch: 0,
}

export const DEFAULT_EXPENSES: ExpenseData = {
  venue: 0,
  advertising: 0,
  staff: 0,
  artists: 0,
  equipment: 0,
  catering: 0,
  transport: 0,
  taxes: 0,
  other: 0,
}
