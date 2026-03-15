import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge tailwind classes safely */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/** Format seconds to "Xh Ym" */
export function formatDuration(minutes) {
  if (!minutes) return '0m'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

/** Format a Date or ISO string to readable form */
export function formatDate(date, opts = {}) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...opts,
  })
}

/** Format time HH:MM */
export function formatTime(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function isClockValue(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}$/.test(value)
}

export function toSessionTimestamp(timeValue, baseDate = new Date()) {
  if (!timeValue) return null
  if (!isClockValue(timeValue)) return timeValue

  const [hours, minutes] = timeValue.split(':').map(Number)
  const date = new Date(baseDate)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

export function getSessionDuration(session) {
  if (!session) return 0
  if (typeof session.duration === 'number') return session.duration
  if (typeof session.duration_minutes === 'number') return session.duration_minutes

  if (session.start_time && session.end_time) {
    const start = new Date(session.start_time)
    const end = new Date(session.end_time)
    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      return Math.max(0, Math.round((end - start) / 60000))
    }
  }

  return 0
}

export function getSessionTimeValue(value) {
  if (!value) return ''
  if (isClockValue(value)) return value

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Clamp a number between min and max */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Get relative time string */
export function relativeTime(date) {
  const now = new Date()
  const d = typeof date === 'string' ? new Date(date) : date
  const diffMs = now - d
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHr = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(d)
}

/** Get difficulty label + color */
export const DIFFICULTY_MAP = {
  1: { label: 'Very Easy', color: '#10b981' },
  2: { label: 'Easy', color: '#34d399' },
  3: { label: 'Medium', color: '#f59e0b' },
  4: { label: 'Hard', color: '#f97316' },
  5: { label: 'Very Hard', color: '#ef4444' },
}

/** Priority colors */
export const PRIORITY_COLORS = {
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  high: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20' },
  urgent: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
}

/** Subject color palette */
const SUBJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4',
  '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
]

export function getSubjectColor(subject, index = 0) {
  if (!subject) return SUBJECT_COLORS[0]
  const hash = subject.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return SUBJECT_COLORS[hash % SUBJECT_COLORS.length]
}

/** Generate motivation quotes */
export const QUOTES = [
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
  { text: 'Success is the sum of small efforts, repeated day in and day out.', author: 'Robert Collier' },
  { text: 'The expert in anything was once a beginner.', author: 'Helen Hayes' },
  { text: 'Learning never exhausts the mind.', author: 'Leonardo da Vinci' },
  { text: 'Education is the passport to the future.', author: 'Malcolm X' },
  { text: 'The beautiful thing about learning is nobody can take it away from you.', author: 'B.B. King' },
  { text: 'Live as if you were to die tomorrow. Learn as if you were to live forever.', author: 'Mahatma Gandhi' },
]

export function getDailyQuote() {
  const day = new Date().getDay()
  return QUOTES[day % QUOTES.length]
}
