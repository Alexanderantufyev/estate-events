import { AlertTriangle } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'

interface DeleteConfirmModalProps {
  isOpen: boolean
  eventTitle: string
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({
  isOpen,
  eventTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-500/15 flex items-center justify-center mx-auto">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Удалить мероприятие?
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            «{eventTitle}» будет удалено без возможности восстановления.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Отмена
          </Button>
          <Button variant="danger" className="flex-1" onClick={onConfirm}>
            Удалить
          </Button>
        </div>
      </div>
    </Modal>
  )
}
