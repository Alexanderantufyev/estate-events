import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useEventStore } from '../store/eventStore'
import type { EventItem } from '../types'

async function publishPost(
  platform: string,
  text: string,
  mediaUrl: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, text, mediaUrl }),
    })
    const data = await res.json()
    return { ok: data.ok === true, error: data.error as string | undefined }
  } catch {
    return { ok: false, error: 'Нет связи с сервером' }
  }
}

export function usePostScheduler() {
  const eventsRef = useRef<EventItem[]>(useEventStore.getState().events)
  const updateEvent = useEventStore((s) => s.updateEvent)

  // Keep eventsRef current without causing the interval effect to restart
  useEffect(() => {
    eventsRef.current = useEventStore.getState().events
    return useEventStore.subscribe((state) => {
      eventsRef.current = state.events
    })
  }, [])

  useEffect(() => {
    const check = async () => {
      const now = new Date()
      for (const event of eventsRef.current) {
        const duePosts = (event.posts ?? []).filter((post) => {
          if (post.status !== 'scheduled') return false
          if (!post.scheduledAt) return false
          return new Date(post.scheduledAt) <= now
        })

        for (const post of duePosts) {
          if (post.platform === 'instagram') continue
          const result = await publishPost(post.platform, post.text, post.mediaUrl)
          if (result.ok) {
            const current = eventsRef.current.find((e) => e.id === event.id)
            if (!current) continue
            const updatedPosts = current.posts.map((p) =>
              p.id === post.id ? { ...p, status: 'published' as const } : p
            )
            updateEvent(event.id, { posts: updatedPosts })
            toast.success(
              `Пост опубликован в ${post.platform === 'telegram' ? 'Telegram' : 'ВКонтакте'}`
            )
          } else {
            toast.error(
              result.error ??
                `Ошибка публикации в ${post.platform === 'telegram' ? 'Telegram' : 'ВКонтакте'}`
            )
          }
        }
      }
    }

    check()
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [updateEvent])
}
