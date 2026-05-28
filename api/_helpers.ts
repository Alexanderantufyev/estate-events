export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)
}

export async function publishTelegram(text: string, mediaUrl?: string) {
  const token = process.env.BOT_TOKEN
  const chatId = process.env.TG_CHANNEL_ID
  if (!token) throw new Error('BOT_TOKEN не задан в настройках сервера')
  if (!chatId) throw new Error('TG_CHANNEL_ID не задан в настройках сервера')

  const base = `https://api.telegram.org/bot${token}`
  let tgRes: Record<string, unknown>

  if (mediaUrl && isImageUrl(mediaUrl)) {
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

export async function publishVk(text: string, mediaUrl?: string) {
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

  if (mediaUrl) {
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
