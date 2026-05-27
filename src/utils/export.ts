import type { EventItem } from '../types'
import { STATUS_LABELS, EVENT_TYPE_LABELS } from '../types'
import { calculateMetrics } from './calculations'
import { formatCurrency } from './formatters'

function buildRows(events: EventItem[]) {
  return events.map((event) => {
    const m = calculateMetrics(event.revenue, event.expenses)
    return {
      Название: event.title,
      Дата: event.date,
      Время: event.time,
      Локация: event.location,
      Организатор: event.organizer,
      Тип: EVENT_TYPE_LABELS[event.type],
      Статус: STATUS_LABELS[event.status],
      'Цена билета': event.revenue.ticketPrice,
      'Продано билетов': event.revenue.ticketsSold,
      Спонсоры: event.revenue.sponsors,
      'Доп. доход': event.revenue.additionalIncome,
      'Бар/Еда': event.revenue.bar,
      Мерч: event.revenue.merch,
      'Общий доход': m.totalRevenue,
      'Аренда площадки': event.expenses.venue,
      Реклама: event.expenses.advertising,
      'Зарплаты персонала': event.expenses.staff,
      'Артисты/Спикеры': event.expenses.artists,
      Оборудование: event.expenses.equipment,
      Кейтеринг: event.expenses.catering,
      Транспорт: event.expenses.transport,
      Налоги: event.expenses.taxes,
      'Прочие расходы': event.expenses.other,
      'Общие расходы': m.totalExpenses,
      'Чистая прибыль': m.netProfit,
      'ROI (%)': m.roi.toFixed(1),
      'Маржинальность (%)': m.margin.toFixed(1),
      'Точка безубыточности (билетов)': m.breakeven,
      'Прибыль на посетителя': m.profitPerAttendee.toFixed(0),
      Комментарий: event.comment,
    }
  })
}

export function exportToCSV(events: EventItem[]): void {
  const rows = buildRows(events)
  if (!rows.length) return

  const headers = Object.keys(rows[0])
  const csvLines = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String((row as Record<string, unknown>)[h] ?? '')
          return val.includes(';') || val.includes('\n') ? `"${val}"` : val
        })
        .join(';')
    ),
  ]

  const bom = '﻿'
  const blob = new Blob([bom + csvLines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  downloadBlob(blob, `мероприятия_${new Date().toISOString().slice(0, 10)}.csv`)
}

export async function exportToExcel(events: EventItem[]): Promise<void> {
  const { utils, writeFile } = await import('xlsx')
  const rows = buildRows(events)

  const ws = utils.json_to_sheet(rows)
  const wb = utils.book_new()
  utils.book_append_sheet(wb, ws, 'Мероприятия')

  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, 12),
  }))
  ws['!cols'] = colWidths

  writeFile(wb, `мероприятия_${new Date().toISOString().slice(0, 10)}.xlsx`)
}

export function exportEventToCSV(event: EventItem): void {
  exportToCSV([event])
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function formatCurrencyExport(value: number): string {
  return formatCurrency(value)
}
