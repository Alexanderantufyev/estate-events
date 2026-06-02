import { useState } from 'react'
import { Plus, Trash2, Copy, Check, Send, Clock, Pencil } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SmmPost, SmmPlatform, SmmPostStatus } from '../../types'
import { SMM_PLATFORM_LABELS, SMM_STATUS_LABELS, SMM_STATUS_COLORS } from '../../types'

interface SmmTabProps {
  posts: SmmPost[]
  onChange: (posts: SmmPost[]) => void
}

const PLATFORMS: SmmPlatform[] = ['telegram', 'vk', 'instagram']

const PLATFORM_ICONS: Record<SmmPlatform, string> = {
  telegram: '✈',
  vk: 'ВК',
  instagram: 'IG',
}

const PLATFORM_URLS: Record<SmmPlatform, string> = {
  telegram: 'https://web.telegram.org',
  vk: 'https://vk.com/feed',
  instagram: 'https://www.instagram.com',
}

const PLATFORM_COLORS: Record<SmmPlatform, string> = {
  telegram: 'bg-sky-500 text-white',
  vk: 'bg-blue-600 text-white',
  instagram: 'bg-gradient-to-br from-purple-500 to-pink-500 text-white',
}

function newPost(): SmmPost {
  return {
    id: crypto.randomUUID(),
    platform: 'telegram',
    text: '',
    mediaUrl: '',
    scheduledAt: '',
    status: 'draft',
  }
}

export function SmmTab({ posts, onChange }: SmmTabProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<SmmPost | null>(null)

  const startNew = () => {
    const p = newPost()
    setDraft(p)
    setEditingId(p.id)
  }

  const savePost = () => {
    if (!draft) return
    if (!draft.text.trim()) {
      toast.error('Введите текст поста')
      return
    }
    const exists = posts.find((p) => p.id === draft.id)
    if (exists) {
      onChange(posts.map((p) => (p.id === draft.id ? draft : p)))
    } else {
      onChange([...posts, draft])
    }
    setEditingId(null)
    setDraft(null)
    toast.success('Пост сохранён')
  }

  const editPost = (id: string) => {
    const post = posts.find((p) => p.id === id)
    if (!post) return
    setDraft({ ...post })
    setEditingId(id)
  }

  const deletePost = (id: string) => {
    onChange(posts.filter((p) => p.id !== id))
    if (editingId === id) { setEditingId(null); setDraft(null) }
  }

  const setStatus = (id: string, status: SmmPostStatus) => {
    onChange(posts.map((p) => (p.id === id ? { ...p, status } : p)))
  }

  const copyPost = (post: SmmPost) => {
    const text = post.mediaUrl
      ? `${post.text}\n\n📎 ${post.mediaUrl}`
      : post.text
    navigator.clipboard.writeText(text).then(() => toast.success('Скопировано в буфер'))
  }

  const publishNow = async (post: SmmPost) => {
    if (post.platform === 'instagram') {
      copyPost(post)
      window.open(PLATFORM_URLS[post.platform], '_blank')
      toast('Instagram: пост скопирован, вставьте вручную', { icon: '📋' })
      return
    }

    const toastId = toast.loading('Публикую...')
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: post.platform, text: post.text, mediaUrl: post.mediaUrl }),
      })
      const data = await res.json()
      if (data.ok) {
        onChange(posts.map((p) => p.id === post.id ? { ...p, status: 'published' as const } : p))
        toast.success('Опубликовано!', { id: toastId })
      } else {
        toast.error(data.error || 'Ошибка публикации', { id: toastId })
      }
    } catch {
      toast.error('Нет связи с сервером', { id: toastId })
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(null)
  }

  const sorted = [...posts].sort((a, b) => {
    if (!a.scheduledAt && !b.scheduledAt) return 0
    if (!a.scheduledAt) return 1
    if (!b.scheduledAt) return -1
    return a.scheduledAt.localeCompare(b.scheduledAt)
  })

  return (
    <div className="space-y-4">
      <p className="text-[10px] text-slate-400 dark:text-slate-500">
        Составьте посты и расписание публикаций
      </p>

      {/* Schedule overview */}
      {sorted.length > 0 && !editingId && (
        <div className="space-y-2">
          {sorted.map((post) => (
            <div
              key={post.id}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3"
            >
              {/* Post header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PLATFORM_COLORS[post.platform]}`}>
                    {PLATFORM_ICONS[post.platform]}
                  </span>
                  {post.scheduledAt && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Clock size={10} />
                      {formatScheduled(post.scheduledAt)}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${SMM_STATUS_COLORS[post.status]}`}>
                    {SMM_STATUS_LABELS[post.status]}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyPost(post)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Копировать пост"
                  >
                    <Copy size={12} />
                  </button>
                  <button
                    onClick={() => editPost(post.id)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Редактировать"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => publishNow(post)}
                    className="p-1.5 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Опубликовать сейчас"
                  >
                    <Send size={12} />
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Post text */}
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                {post.text}
              </p>

              {/* Media preview */}
              {post.mediaUrl && (
                <div className="mt-2">
                  {isImageUrl(post.mediaUrl) ? (
                    <img
                      src={post.mediaUrl}
                      alt="медиа"
                      className="w-full max-h-32 object-cover rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <a
                      href={post.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:underline truncate block"
                    >
                      📎 {post.mediaUrl}
                    </a>
                  )}
                </div>
              )}

              {/* Status buttons */}
              <div className="flex gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
                {(['draft', 'scheduled', 'published'] as SmmPostStatus[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(post.id, s)}
                    className={`flex-1 py-1 text-[10px] font-medium rounded-lg transition-all ${
                      post.status === s
                        ? SMM_STATUS_COLORS[s] + ' ring-1 ring-current'
                        : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-700/50'
                    }`}
                  >
                    {SMM_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / New post form */}
      {editingId && draft && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            {posts.find((p) => p.id === draft.id) ? 'Редактирование' : 'Новый пост'}
          </p>

          {/* Platform */}
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Платформа</label>
            <div className="flex gap-2">
              {PLATFORMS.map((pl) => (
                <button
                  key={pl}
                  onClick={() => setDraft((d) => d ? { ...d, platform: pl } : d)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    draft.platform === pl
                      ? PLATFORM_COLORS[pl]
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {SMM_PLATFORM_LABELS[pl]}
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled date + time */}
          <div>
            <label className="text-[10px] text-slate-400 mb-0.5 block">Дата и время публикации</label>
            <input
              type="datetime-local"
              value={draft.scheduledAt}
              onChange={(e) => setDraft((d) => d ? { ...d, scheduledAt: e.target.value } : d)}
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
            />
          </div>

          {/* Text */}
          <div>
            <label className="text-[10px] text-slate-400 mb-0.5 block">Текст поста</label>
            <textarea
              value={draft.text}
              onChange={(e) => setDraft((d) => d ? { ...d, text: e.target.value } : d)}
              placeholder="Напишите текст публикации..."
              rows={5}
              className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none transition-all leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 text-right mt-0.5">{draft.text.length} симв.</p>
          </div>

          {/* Media URL */}
          <div>
            <label className="text-[10px] text-slate-400 mb-0.5 block">Медиа (ссылка на фото/видео)</label>
            <input
              type="url"
              value={draft.mediaUrl}
              onChange={(e) => setDraft((d) => d ? { ...d, mediaUrl: e.target.value } : d)}
              placeholder="https://..."
              className="w-full px-2.5 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
            />
            {draft.mediaUrl && isImageUrl(draft.mediaUrl) && (
              <img
                src={draft.mediaUrl}
                alt="preview"
                className="mt-2 w-full max-h-32 object-cover rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={cancelEdit}
              className="flex-1 py-2 text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={savePost}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-lg transition-colors"
            >
              <Check size={13} /> Сохранить
            </button>
          </div>
        </div>
      )}

      {/* Add post button */}
      {!editingId && (
        <button
          onClick={startNew}
          className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-400 text-xs font-medium rounded-xl transition-colors"
        >
          <Plus size={13} /> Добавить пост
        </button>
      )}
    </div>
  )
}

function formatScheduled(value: string): string {
  if (!value) return ''
  // datetime-local format: YYYY-MM-DDTHH:MM
  if (value.includes('T')) {
    const [datePart, timePart] = value.split('T')
    const [year, month, day] = datePart.split('-')
    return `${day}.${month}.${year} ${timePart}`
  }
  return value
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)
}
