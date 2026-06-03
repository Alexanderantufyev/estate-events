import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import type { EventItem } from '../src/types'
import { isAuthenticated } from './_auth'

const KEY = 'events'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!isAuthenticated(req)) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  if (req.method === 'GET') {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return res.status(500).json({ error: 'Redis env vars not configured', events: [] })
    }
    try {
      const redis = Redis.fromEnv()
      const events = (await redis.get<EventItem[]>(KEY)) ?? []
      return res.status(200).json({ events })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('Redis get error:', message)
      return res.status(500).json({ error: message, events: [] })
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
