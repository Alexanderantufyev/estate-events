export function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(url)
}

async function uploadVkWallPhoto(mediaUrl: string, groupId: string, userToken: string): Promise<string> {
  const imgRes = await fetch(mediaUrl)
  if (!imgRes.ok) throw new Error(`Не удалось скачать изображение: ${imgRes.status}`)
  const imgBuffer = await imgRes.arrayBuffer()
  const contentType = imgRes.headers.get('content-type') ?? 'image/jpeg'

  const serverRes = await fetch(
    `https://api.vk.com/method/photos.getWallUploadServer?${new URLSearchParams({
      group_id: groupId,
      access_token: userToken,
      v: '5.199',
    })}`
  )
  const serverData = await serverRes.json() as Record<string, unknown>
  if (serverData.error) {
    const err = serverData.error as Record<string, unknown>
    throw new Error(`VK photos.getWallUploadServer ${err.error_code ?? ''}: ${err.error_msg ?? ''}`)
  }
  const uploadUrl = (serverData.response as Record<string, unknown>).upload_url as string

  const ext = mediaUrl.split('.').pop()?.split('?')[0] ?? 'jpg'
  const form = new FormData()
  form.append('photo', new Blob([imgBuffer], { type: contentType }), `photo.${ext}`)
  const uploadRes = await fetch(uploadUrl, { method: 'POST', body: form })
  const uploadData = await uploadRes.json() as Record<string, unknown>
  if (!uploadData.photo) throw new Error('VK upload: файл не загружен на сервер')

  const saveRes = await fetch(
    `https://api.vk.com/method/photos.saveWallPhoto?${new URLSearchParams({
      group_id: groupId,
      photo: uploadData.photo as string,
      server: String(uploadData.server),
      hash: uploadData.hash as string,
      access_token: userToken,
      v: '5.199',
    })}`
  )
  const saveData = await saveRes.json() as Record<string, unknown>
  if (saveData.error) {
    const err = saveData.error as Record<string, unknown>
    throw new Error(`VK photos.saveWallPhoto ${err.error_code ?? ''}: ${err.error_msg ?? ''}`)
  }
  const photos = saveData.response as Array<Record<string, unknown>>
  const photo = photos[0]
  return `photo${photo.owner_id}_${photo.id}`
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

  if (mediaUrl && isImageUrl(mediaUrl)) {
    const userToken = process.env.VK_USER_TOKEN
    if (!userToken) throw new Error('Для публикации фото в VK нужен VK_USER_TOKEN')
    const attachment = await uploadVkWallPhoto(mediaUrl, groupId, userToken)
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
