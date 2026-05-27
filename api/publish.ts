import type { VercelRequest, VercelResponse } from '@vercel/node'

interface PublishRequest {
  platform: 'telegram' | 'vk' | 'instagram'
  text: string
  mediaUrl?: string
}

async function publishTelegram(text: string, mediaUrl?: string) {
  const token = process.env.BOT_TOKEN
  const chatId = process.env.TG_CHANNEL_ID
  if (!token || !chatId) throw new Error('TG credentials missing')

  const base = `https://api.telegram.org/bot${token}`

  if (mediaUrl && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(mediaUrl)) {
    const res = await fetch(`${base}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: mediaUrl, caption: text }),
    })
    return res.json()
  }

  const res = await fetch(`${base}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
  return res.json()
}

async function publishVk(text: string, mediaUrl?: string) {
  const token = process.env.VK_TOKEN
  const groupId = process.env.VK_GROUP_ID
  if (!token || !groupId) throw new Error('VK credentials missing')

  const params = new URLSearchParams({
    owner_id: `-${groupId}`,
    message: text,
    access_token: token,
    v: '5.199',
  })

  // If media is an image, attach via photos.getWallUploadServer → upload → save → post
  // For simplicity, post text only when mediaUrl is present (VK photo upload requires multi-step)
  if (mediaUrl) {
    params.set('message', `${text}\n\n${mediaUrl}`)
  }

  const res = await fetch(`https://api.vk.com/method/wall.post?${params}`)
  return res.json()
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { platform, text, mediaUrl } = req.body as PublishRequest

  if (!platform || !text) {
    return res.status(400).json({ error: 'platform and text are required' })
  }

  try {
    let result
    if (platform === 'telegram') {
      result = await publishTelegram(text, mediaUrl)
    } else if (platform === 'vk') {
      result = await publishVk(text, mediaUrl)
    } else {
      return res.status(400).json({ error: 'Instagram auto-publish not supported' })
    }
    return res.status(200).json({ ok: true, result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return res.status(500).json({ ok: false, error: message })
  }
}
