import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { useEventStore } from '../../store/eventStore'
import type { EventType, EventStatus } from '../../types'
import { EVENT_TYPE_LABELS, STATUS_LABELS, DEFAULT_REVENUE, DEFAULT_EXPENSES } from '../../types'
import toast from 'react-hot-toast'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  defaultDate?: string
}

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

const TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export function CreateEventModal({ isOpen, onClose, defaultDate }: CreateEventModalProps) {
  const { addEvent, currentDate } = useEventStore()

  const [form, setForm] = useState({
    title: '',
    date: defaultDate || currentDate,
    time: '18:00',
    endTime: '22:00',
    location: '',
    organizer: '',
    type: 'other' as EventType,
    status: 'planned' as EventStatus,
    comment: '',
  })

  const [errors, setErrors] = useState<Partial<typeof form>>({})

  const set = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const errs: Partial<typeof form> = {}
    if (!form.title.trim()) errs.title = 'Обязательное поле'
    if (!form.date) errs.date = 'Обязательное поле'
    if (!form.time) errs.time = 'Обязательное поле'
    setErrors(errs)
    return !Object.keys(errs).length
  }

  const handleSubmit = () => {
    if (!validate()) return

    addEvent({
      ...form,
      revenue: { ...DEFAULT_REVENUE },
      expenses: { ...DEFAULT_EXPENSES },
    })
    toast.success('Мероприятие создано!')
    onClose()
    resetForm()
  }

  const resetForm = () => {
    setForm({
      title: '',
      date: currentDate,
      time: '18:00',
      endTime: '22:00',
      location: '',
      organizer: '',
      type: 'other',
      status: 'planned',
      comment: '',
    })
    setErrors({})
  }

  const handleClose = () => {
    onClose()
    resetForm()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Новое мероприятие" size="lg">
      <div className="p-6 space-y-4">
        <Input
          label="Название *"
          placeholder="Название мероприятия"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          error={errors.title}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Дата *"
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            error={errors.date}
          />
          <Select
            label="Статус"
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(e) => set('status', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Время начала"
            type="time"
            value={form.time}
            onChange={(e) => set('time', e.target.value)}
            error={errors.time}
          />
          <Input
            label="Время окончания"
            type="time"
            value={form.endTime}
            onChange={(e) => set('endTime', e.target.value)}
          />
        </div>

        <Input
          label="Локация"
          placeholder="Место проведения"
          value={form.location}
          onChange={(e) => set('location', e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Организатор"
            placeholder="ФИО организатора"
            value={form.organizer}
            onChange={(e) => set('organizer', e.target.value)}
          />
          <Select
            label="Тип мероприятия"
            value={form.type}
            options={TYPE_OPTIONS}
            onChange={(e) => set('type', e.target.value)}
          />
        </div>

        <Textarea
          label="Комментарий"
          placeholder="Дополнительная информация..."
          value={form.comment}
          onChange={(e) => set('comment', e.target.value)}
        />
      </div>

      <div className="px-6 pb-6 flex gap-3 justify-end">
        <Button variant="secondary" onClick={handleClose}>
          Отмена
        </Button>
        <Button onClick={handleSubmit}>
          Создать мероприятие
        </Button>
      </div>
    </Modal>
  )
}
