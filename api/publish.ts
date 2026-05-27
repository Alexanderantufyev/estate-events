import type { VercelRequest, VercelResponse } from '@vercel/node'

interface PublishRequest {
  platform: 'telegram' | 'vk' | 'instagram'
  text: string
  mediaUrl?: string
}

async function publishTelegram(text: string, mediaUrl?: string) {
  const token = process.env.BOT_TOKEN
  const chatId = process.env.TG_CHANNEL_ID
  if (!token) throw new Error('BOT_TOKEN не задан в настройках сервера')
  if (!chatId) throw new Error('TG_CHANNEL_ID не задан в настройках сервера')

  const base = `https://api.telegram.org/bot${token}`

  let tgRes: Record<string, unknown>

  if (mediaUrl && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(mediaUrl)) {
    const res = await fetch(`${base}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: mediaUrl, caption: text }),
    })
    tgRes = await res.json() as Record<string, unknown>
  } else {
    const res = await fetch(`${base}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    tgRes = await res.json() as Record<string, unknown>
  }

  if (!tgRes.ok) {
    const desc = tgRes.description as string | undefined
    const code = tgRes.error_code as number | undefined
    throw new Error(`Telegram API ${code ?? ''}: ${desc ?? JSON.stringify(tgRes)}`)
  }

  return tgRes
}

async function uploadPhotoToVk(imageUrl: string, token: string, groupId: string): Promise<string> {
  // Step 1: get upload server URL
  const serverRes = await fetch(
    `https://api.vk.com/method/photos.getWallUploadServer?group_id=${groupId}&access_token=${token}&v=5.199`
  )
  const serverData = await serverRes.json() as Record<string, unknown>
  if (serverData.error) {
    const e = serverData.error as Record<string, unknown>
    throw new Error(`VK getWallUploadServer: ${e.error_msg ?? JSON.stringify(e)}`)
  }
  const uploadUrl = (serverData.response as Record<string, unknown>).upload_url as string

  // Step 2: fetch image and upload to VK
  const imgRes = await fetch(imageUrl)
  if (!imgRes.ok) throw new Error(`Не удалось загрузить изображение: ${imageUrl}`)
  const imgBuffer = await imgRes.arrayBuffer()
  const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'
  const blob = new Blob([imgBuffer], { type: contentType })

  const form = new FormData()
  form.append('photo', blob, 'photo.jpg')

  const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form })
  const uploadData = await uploadRes.json() as Record<string, unknown>

  // Step 3: save photo and get attachment string
  const saveParams = new URLSearchParams({
    group_id: groupId,
    photo: String(uploadData.photo),
    server: String(uploadData.server),
    hash: String(uploadData.hash),
    access_token: token,
    v: '5.199',
  })
  const saveRes = await fetch(`https://api.vk.com/method/photos.saveWallPhoto?${saveParams}`)
  const saveData = await saveRes.json() as Record<string, unknown>
  if (saveData.error) {
    const e = saveData.error as Record<string, unknown>
    throw new Error(`VK saveWallPhoto: ${e.error_msg ?? JSON.stringify(e)}`)
  }
  const photo = (saveData.response as Record<string, unknown>[])[0] as Record<string, unknown>
  return `photo${photo.owner_id}_${photo.id}`
}

async function publishVk(text: string, mediaUrl?: string) {
  const token = process.env.VK_TOKEN
  const groupId = process.env.VK_GROUP_ID
  if (!token) throw new Error('VK_TOKEN не задан в настройках сервера')
  if (!groupId) throw new Error('VK_GROUP_ID не задан в настройках сервера')

  const params = new URLSearchParams({
    owner_id: `-${groupId}`,
    message: text,
    access_token: token,
    v: '5.199',
  })

  const isImage = mediaUrl && /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(mediaUrl)
  if (isImage) {
    const attachment = await uploadPhotoToVk(mediaUrl, token, groupId)
    params.set('attachments', attachment)
  } else if (mediaUrl) {
    params.set('message', `${text}\n\n${mediaUrl}`)
  }

  const res = await fetch(`https://api.vk.com/method/wall.post?${params}`)
  const data = await res.json() as Record<string, unknown>

  if (data.error) {
    const err = data.error as Record<string, unknown>
    throw new Error(`VK API ${err.error_code ?? ''}: ${err.error_msg ?? JSON.stringify(err)}`)
  }

  return data
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
