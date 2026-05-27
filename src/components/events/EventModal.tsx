import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Clock,
  MapPin,
  User,
  MessageSquare,
  Edit3,
  Trash2,
  Copy,
  Save,
  X,
  Tag,
  Download,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { ProfitCalculator } from '../calculator/ProfitCalculator'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { useEventStore } from '../../store/eventStore'
import type { EventItem, RevenueData, ExpenseData, SmmPost } from '../../types'
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_DOT_COLORS,
  EVENT_TYPE_LABELS,
} from '../../types'
import { SmmTab } from '../calendar/SmmTab'
import { formatDate } from '../../utils/formatters'
import { exportEventToCSV } from '../../utils/export'
import toast from 'react-hot-toast'

interface EventModalProps {
  eventId: string | null
  onClose: () => void
}

type ModalTab = 'details' | 'finances' | 'smm'

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export function EventModal({ eventId, onClose }: EventModalProps) {
  const { getEventById, updateEvent, deleteEvent, duplicateEvent } = useEventStore()
  const event = eventId ? getEventById(eventId) : null

  const [tab, setTab] = useState<ModalTab>('details')
  const [isEditing, setIsEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editForm, setEditForm] = useState<Partial<EventItem>>({})

  if (!event) return null

  const currentData = isEditing ? { ...event, ...editForm } : event

  const startEdit = () => {
    setEditForm({ ...event })
    setIsEditing(true)
  }

  const cancelEdit = () => {
    setIsEditing(false)
    setEditForm({})
  }

  const saveEdit = () => {
    if (!editForm.title?.trim()) {
      toast.error('Введите название мероприятия')
      return
    }
    updateEvent(event.id, editForm)
    setIsEditing(false)
    setEditForm({})
    toast.success('Мероприятие сохранено')
  }

  const handleDelete = () => {
    deleteEvent(event.id)
    toast.success('Мероприятие удалено')
    onClose()
  }

  const handleDuplicate = () => {
    duplicateEvent(event.id)
    toast.success('Мероприятие дублировано')
  }

  const handleRevenueChange = useCallback(
    (data: RevenueData) => {
      updateEvent(event.id, { revenue: data })
    },
    [event.id, updateEvent]
  )

  const handleExpensesChange = useCallback(
    (data: ExpenseData) => {
      updateEvent(event.id, { expenses: data })
    },
    [event.id, updateEvent]
  )

  const handlePostsChange = useCallback(
    (posts: SmmPost[]) => {
      updateEvent(event.id, { posts })
    },
    [event.id, updateEvent]
  )

  const setField = (field: keyof EventItem, value: string) => {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <Modal
        isOpen={!!eventId}
        onClose={onClose}
        size="xl"
        className="max-h-[90vh]"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            {isEditing ? (
              <input
                className="flex-1 text-base font-semibold bg-transparent border-b-2 border-emerald-500 text-slate-900 dark:text-slate-100 focus:outline-none pb-0.5"
                value={editForm.title || ''}
                onChange={(e) => setField('title', e.target.value)}
                autoFocus
              />
            ) : (
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {event.title}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {formatDate(event.date)} · {event.time}–{event.endTime}
                </p>
              </div>
            )}

            <div className="flex items-center gap-1.5 shrink-0">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => exportEventToCSV(event)}
                    title="Экспорт"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={handleDuplicate}
                    title="Дублировать"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    onClick={startEdit}
                    title="Редактировать"
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => setShowDelete(true)}
                    title="Удалить"
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="secondary" onClick={cancelEdit}>
                    <X size={12} />
                    Отмена
                  </Button>
                  <Button size="sm" onClick={saveEdit}>
                    <Save size={12} />
                    Сохранить
                  </Button>
                </>
              )}
              {!isEditing && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors ml-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1 bg-slate-50 dark:bg-slate-800/50 px-6 py-2">
            {([
              { key: 'details', label: 'Детали' },
              { key: 'finances', label: 'Финансы' },
              { key: 'smm', label: 'СММ' },
            ] as { key: ModalTab; label: string }[]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  tab === t.key
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'details' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {isEditing ? (
                  <EditForm
                    form={editForm as EventItem}
                    onChange={setField}
                  />
                ) : (
                  <ViewDetails event={currentData as EventItem} />
                )}
              </motion.div>
            )}

            {tab === 'finances' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ProfitCalculator
                  revenue={currentData.revenue}
                  expenses={currentData.expenses}
                  onRevenueChange={handleRevenueChange}
                  onExpensesChange={handleExpensesChange}
                  readOnly={isEditing}
                />
              </motion.div>
            )}

            {tab === 'smm' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <SmmTab
                  posts={event.posts ?? []}
                  onChange={handlePostsChange}
                />
              </motion.div>
            )}
          </div>
        </div>
      </Modal>

      <DeleteConfirmModal
        isOpen={showDelete}
        eventTitle={event.title}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  )
}

function ViewDetails({ event }: { event: EventItem }) {
  const fields = [
    { icon: Clock, label: 'Время', value: `${event.time} — ${event.endTime}` },
    { icon: MapPin, label: 'Локация', value: event.location },
    { icon: User, label: 'Организатор', value: event.organizer },
    { icon: Tag, label: 'Тип', value: EVENT_TYPE_LABELS[event.type] },
  ].filter((f) => f.value)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={STATUS_COLORS[event.status]} dot dotColor={STATUS_DOT_COLORS[event.status]}>
          {STATUS_LABELS[event.status]}
        </Badge>
        <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
          {EVENT_TYPE_LABELS[event.type]}
        </Badge>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {formatDate(event.date)}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
          >
            <Icon size={14} className="text-slate-400 shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{label}</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {event.comment && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={13} className="text-slate-400" />
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Комментарий</p>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {event.comment}
          </p>
        </div>
      )}

      <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5">
        <p>Создано: {new Date(event.createdAt).toLocaleString('ru-RU')}</p>
        <p>Обновлено: {new Date(event.updatedAt).toLocaleString('ru-RU')}</p>
      </div>
    </div>
  )
}

function EditForm({
  form,
  onChange,
}: {
  form: EventItem
  onChange: (field: keyof EventItem, value: string) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Дата"
          type="date"
          value={form.date || ''}
          onChange={(e) => onChange('date', e.target.value)}
        />
        <Select
          label="Статус"
          value={form.status || 'planned'}
          options={STATUS_OPTIONS}
          onChange={(e) => onChange('status', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Время начала"
          type="time"
          value={form.time || ''}
          onChange={(e) => onChange('time', e.target.value)}
        />
        <Input
          label="Время окончания"
          type="time"
          value={form.endTime || ''}
          onChange={(e) => onChange('endTime', e.target.value)}
        />
      </div>

      <Input
        label="Локация"
        value={form.location || ''}
        onChange={(e) => onChange('location', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Организатор"
          value={form.organizer || ''}
          onChange={(e) => onChange('organizer', e.target.value)}
        />
        <Select
          label="Тип"
          value={form.type || 'other'}
          options={TYPE_OPTIONS}
          onChange={(e) => onChange('type', e.target.value)}
        />
      </div>

      <Textarea
        label="Комментарий"
        value={form.comment || ''}
        onChange={(e) => onChange('comment', e.target.value)}
      />
    </div>
  )
}
