import type { VercelRequest, VercelResponse } from '@vercel/node'
import { publishTelegram, publishVk, isImageUrl } from './_helpers'

interface PublishRequest {
  platform: 'telegram' | 'vk' | 'instagram'
  text: string
  mediaUrl?: string
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { platform, text, mediaUrl } = req.body as PublishRequest

  if (!platform || !text) {
    return res.status(400).json({ error: 'platform and text are required' })
  }

  if (platform === 'instagram') {
    return res.status(400).json({ error: 'Instagram auto-publish not supported' })
  }

  if (platform === 'vk' && mediaUrl && isImageUrl(mediaUrl)) {
    return res.status(400).json({ error: 'VK photo upload requires user token' })
  }

  try {
    let result
    if (platform === 'telegram') {
      result = await publishTelegram(text, mediaUrl)
    } else {
      result = await publishVk(text, mediaUrl)
    }
    return res.status(200).json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ ok: false, error: message })
  }
}
