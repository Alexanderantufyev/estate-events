import type { EventItem, EventStatus, EventType } from '../types'
import { DEFAULT_REVENUE, DEFAULT_EXPENSES } from '../types'

interface ParsedICSEvent {
  title: string
  date: string
  time: string
  endTime: string
  location: string
  organizer: string
  comment: string
  status: EventStatus
  type: EventType
}

function unfoldLines(raw: string): string[] {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n[ \t]/g, '')
    .split('\n')
}

function decodeText(value: string): string {
  return value
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

function parseDateTime(line: string): { date: string; time: string } {
  const colonIdx = line.indexOf(':')
  const params = line.slice(0, colonIdx).toLowerCase()
  const value = line.slice(colonIdx + 1).trim()

  if (params.includes('value=date') || value.length === 8) {
    const d = value.slice(0, 8)
    return {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      time: '09:00',
    }
  }

  const dateStr = value.slice(0, 8)
  const timeStr = value.slice(9, 15)
  const isUtc = value.endsWith('Z')

  const date = `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
  const hour = parseInt(timeStr.slice(0, 2))
  const min = parseInt(timeStr.slice(2, 4))

  if (isUtc) {
    const utcDate = new Date(
      Date.UTC(
        parseInt(dateStr.slice(0, 4)),
        parseInt(dateStr.slice(4, 6)) - 1,
        parseInt(dateStr.slice(6, 8)),
        hour,
        min
      )
    )
    return {
      date: utcDate.toISOString().slice(0, 10),
      time: `${String(utcDate.getHours()).padStart(2, '0')}:${String(utcDate.getMinutes()).padStart(2, '0')}`,
    }
  }

  return {
    date,
    time: `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`,
  }
}

function mapStatus(value: string): EventStatus {
  const v = value.toUpperCase().trim()
  if (v === 'CONFIRMED') return 'confirmed'
  if (v === 'CANCELLED' || v === 'CANCELED') return 'cancelled'
  if (v === 'TENTATIVE') return 'planned'
  return 'planned'
}

function extractOrganizer(value: string): string {
  const cnMatch = value.match(/CN=([^:;]+)/i)
  if (cnMatch) return cnMatch[1].replace(/^"(.*)"$/, '$1').trim()
  const emailMatch = value.match(/mailto:(.+)/i)
  if (emailMatch) return emailMatch[1].trim()
  return ''
}

export function parseICS(content: string): ParsedICSEvent[] {
  const lines = unfoldLines(content)
  const events: ParsedICSEvent[] = []
  let current: Partial<ParsedICSEvent> | null = null

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {
        title: '',
        date: '',
        time: '09:00',
        endTime: '10:00',
        location: '',
        organizer: '',
        comment: '',
        status: 'planned',
        type: 'other',
      }
      continue
    }

    if (line === 'END:VEVENT' && current) {
      if (current.title && current.date) {
        events.push(current as ParsedICSEvent)
      }
      current = null
      continue
    }

    if (!current) continue

    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const keyPart = line.slice(0, colonIdx).toUpperCase()
    const key = keyPart.split(';')[0]
    const value = line.slice(colonIdx + 1)

    switch (key) {
      case 'SUMMARY':
        current.title = decodeText(value)
        break
      case 'DTSTART': {
        const { date, time } = parseDateTime(line)
        current.date = date
        current.time = time
        break
      }
      case 'DTEND': {
        const { time } = parseDateTime(line)
        current.endTime = time
        break
      }
      case 'LOCATION':
        current.location = decodeText(value)
        break
      case 'DESCRIPTION':
        current.comment = decodeText(value)
        break
      case 'STATUS':
        current.status = mapStatus(value)
        break
      case 'ORGANIZER':
        current.organizer = extractOrganizer(line.slice(colonIdx - (colonIdx - keyPart.length)))
        break
    }
  }

  return events
}

export function convertToEventItems(parsed: ParsedICSEvent[]): Omit<EventItem, 'id' | 'createdAt' | 'updatedAt'>[] {
  return parsed.map((p) => ({
    title: p.title || 'Без названия',
    date: p.date,
    time: p.time,
    endTime: p.endTime,
    location: p.location,
    organizer: p.organizer,
    type: p.type,
    status: p.status,
    comment: p.comment,
    revenue: { ...DEFAULT_REVENUE },
    expenses: { ...DEFAULT_EXPENSES },
    tasks: [],
    timeline: [],
    posts: [],
  }))
}

export function readICSFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'))
    reader.readAsText(file, 'UTF-8')
  })
}
