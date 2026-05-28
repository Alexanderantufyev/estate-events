import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import type { EventItem } from '../src/types'

const KEY = 'events'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    try {
      const redis = Redis.fromEnv()
      const events = (await redis.get<EventItem[]>(KEY)) ?? []
      return res.status(200).json({ events })
    } catch (err) {
      console.error('Redis get error:', err)
      return res.status(200).json({ events: [] })
    }
  }

  if (req.method === 'PUT') {
    try {
      const { events } = req.body as { events: EventItem[] }
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'events must be an array' })
      }
      const redis = Redis.fromEnv()
      await redis.set(KEY, events)
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('Redis set error:', err)
      return res.status(500).json({ ok: false, error: 'Failed to save' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
