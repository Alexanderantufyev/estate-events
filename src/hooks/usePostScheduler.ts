import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useEventStore } from '../store/eventStore'

async function publishPost(platform: string, text: string, mediaUrl: string): Promise<boolean> {
  try {
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform, text, mediaUrl }),
    })
    const data = await res.json()
    return data.ok === true
  } catch {
    return false
  }
}

export function usePostScheduler() {
  const { events, updateEvent } = useEventStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const check = async () => {
      const now = new Date()
      for (const event of events) {
        const duePosts = (event.posts ?? []).filter((post) => {
          if (post.status !== 'scheduled') return false
          if (!post.scheduledAt) return false
          // scheduledAt format: YYYY-MM-DDTHH:MM
          const scheduled = new Date(post.scheduledAt)
          return scheduled <= now
        })

        for (const post of duePosts) {
          if (post.platform === 'instagram') {
            // Instagram can't auto-publish — skip, just mark
            continue
          }
          const ok = await publishPost(post.platform, post.text, post.mediaUrl)
          if (ok) {
            const updatedPosts = event.posts.map((p) =>
              p.id === post.id ? { ...p, status: 'published' as const } : p
            )
            updateEvent(event.id, { posts: updatedPosts })
            toast.success(`Пост опубликован в ${post.platform === 'telegram' ? 'Telegram' : 'ВКонтакте'}`)
          } else {
            toast.error(`Ошибка публикации в ${post.platform}`)
          }
        }
      }
    }

    // Check immediately on mount, then every 60 seconds
    check()
    timerRef.current = setInterval(check, 60_000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [events, updateEvent])
}
