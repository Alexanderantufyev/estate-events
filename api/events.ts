import type { VercelRequest, VercelResponse } from '@vercel/node'
import { kv } from '@vercel/kv'
import type { EventItem } from '../src/types'

const KEY = 'events'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const events = (await kv.get<EventItem[]>(KEY)) ?? []
      return res.status(200).json({ events })
    } catch (err) {
      console.error('KV get error:', err)
      return res.status(200).json({ events: [] })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { events } = req.body as { events: EventItem[] }
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'events must be an array' })
      }
      await kv.set(KEY, events)
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('KV set error:', err)
      return res.status(500).json({ ok: false, error: 'Failed to save' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
