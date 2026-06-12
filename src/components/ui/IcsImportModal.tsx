import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, Calendar, MapPin, Clock, CheckCircle, AlertCircle, X } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'
import { Badge } from './Badge'
import { useEventStore } from '../../store/eventStore'
import { parseICS, convertToEventItems, readICSFile } from '../../utils/icsParser'
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT_COLORS } from '../../types'
import { formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

interface IcsImportModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'upload' | 'preview' | 'done'

export function IcsImportModal({ isOpen, onClose }: IcsImportModalProps) {
  const { addEvent } = useEventStore()
  const fileRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [parsedEvents, setParsedEvents] = useState<ReturnType<typeof convertToEventItems>>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setStep('upload')
    setParsedEvents([])
    setSelected(new Set())
    setError('')
  }

  const handleClose = () => {
    onClose()
    setTimeout(reset, 300)
  }

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.ics')) {
      setError('Нужен файл формата .ics (iCalendar)')
      return
    }
    setError('')
    try {
      const content = await readICSFile(file)
      const parsed = parseICS(content)
      const converted = convertToEventItems(parsed)

      if (!converted.length) {
        setError('В файле не найдено мероприятий')
        return
      }

      setParsedEvents(converted)
      setSelected(new Set(converted.map((_, i) => i)))
      setStep('preview')
    } catch {
      setError('Не удалось прочитать файл. Проверьте формат.')
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const toggleSelect = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === parsedEvents.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(parsedEvents.map((_, i) => i)))
    }
  }

  const handleImport = () => {
    const toImport = parsedEvents.filter((_, i) => selected.has(i))
    toImport.forEach((event) => addEvent(event))
    toast.success(`Импортировано ${toImport.length} мероприятий из Google Календаря`)
    setStep('done')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Импорт из Google Календаря"
      size="xl"
    >
      <div className="p-6">
        {step === 'upload' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Экспортируй календарь из Google и загрузи файл <span className="font-semibold text-slate-700 dark:text-slate-200">.ics</span>
            </p>

            <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-4 space-y-2">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Как получить файл .ics из Google Календаря:</p>
              <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
                <li>Открой <span className="font-medium">calendar.google.com</span></li>
                <li>Нажми шестерёнку ⚙️ → <span className="font-medium">Настройки</span></li>
                <li>Слева выбери нужный календарь</li>
                <li>Прокрути вниз → <span className="font-medium">"Экспортировать календарь"</span></li>
                <li>Скачается файл .ics — загрузи его сюда</li>
              </ol>
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-pomor-400 bg-pomor-50 dark:bg-pomor-500/10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-pomor-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <Upload size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Перетащи файл сюда или нажми для выбора
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Поддерживается формат .ics</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".ics"
              className="hidden"
              onChange={handleFileInput}
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </motion.div>
        )}

        {step === 'preview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Найдено <span className="font-semibold text-slate-800 dark:text-slate-100">{parsedEvents.length}</span> мероприятий.
                Выбери какие импортировать:
              </p>
              <button
                onClick={toggleAll}
                className="text-xs text-pomor-600 dark:text-pomor-400 hover:underline font-medium"
              >
                {selected.size === parsedEvents.length ? 'Снять все' : 'Выбрать все'}
              </button>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {parsedEvents.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => toggleSelect(i)}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selected.has(i)
                      ? 'border-pomor-300 dark:border-pomor-500/40 bg-pomor-50/50 dark:bg-pomor-500/5'
                      : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-50'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    selected.has(i)
                      ? 'border-pomor-500 bg-pomor-500'
                      : 'border-slate-300 dark:border-slate-600'
                  }`}>
                    {selected.has(i) && <CheckCircle size={12} className="text-white" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {event.title}
                      </p>
                      <Badge className={STATUS_COLORS[event.status]} dot dotColor={STATUS_DOT_COLORS[event.status]}>
                        {STATUS_LABELS[event.status]}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <Calendar size={10} />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <Clock size={10} />
                        {event.time} — {event.endTime}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 truncate max-w-[200px]">
                          <MapPin size={10} />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={reset} className="gap-1.5">
                <X size={13} />
                Назад
              </Button>
              <Button
                onClick={handleImport}
                disabled={selected.size === 0}
                className="flex-1"
              >
                Импортировать {selected.size > 0 ? `(${selected.size})` : ''}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-pomor-100 dark:bg-pomor-500/15 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-pomor-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                Импорт завершён!
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Мероприятия добавлены в календарь
              </p>
            </div>
            <Button onClick={handleClose} className="mx-auto">
              Открыть календарь
            </Button>
          </motion.div>
        )}
      </div>
    </Modal>
  )
}
