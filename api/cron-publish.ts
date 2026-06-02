import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Redis } from '@upstash/redis'
import type { EventItem } from '../src/types'
import { publishTelegram, publishVk, isImageUrl } from './_helpers'

const KEY = 'events'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers['authorization'] !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const redis = Redis.fromEnv()
  const events = (await redis.get<EventItem[]>(KEY)) ?? []
  const now = new Date()
  let published = 0

  for (const event of events) {
    for (const post of event.posts ?? []) {
      if (post.status !== 'scheduled' || !post.scheduledAt) continue
      if (new Date(post.scheduledAt) > now) continue
      if (post.platform === 'instagram') continue

      try {
        if (post.platform === 'telegram') {
          await publishTelegram(post.text, post.mediaUrl || undefined)
        } else if (post.platform === 'vk') {
          await publishVk(post.text, post.mediaUrl || undefined)
        }
        post.status = 'published'
        published++
        console.log(`Published post ${post.id} to ${post.platform}`)
      } catch (err) {
        console.error(`Failed to publish post ${post.id}:`, err)
      }
    }
  }

  if (published > 0) {
    await redis.set(KEY, events)
  }

  return res.status(200).json({ ok: true, published })
}
