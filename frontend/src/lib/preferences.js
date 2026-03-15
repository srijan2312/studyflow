const PREFERENCES_KEY = 'studyflow.preferences.v1'
const ACTIVITY_LOG_KEY = 'studyflow.account-activity.v1'

export const DEFAULT_PREFERENCES = {
  theme: 'dark',
  accent: 'indigo',
  notifications: {
    dailyReminder: true,
    weeklyDigest: false,
    goalDeadlines: true,
    weeklyReportEmail: false,
    weeklyReportDay: 'Monday',
  },
  backup: {
    lastCreatedAt: '',
  },
}

export const ACCENT_OPTIONS = [
  { id: 'indigo', label: 'Indigo', hex: '#6366f1' },
  { id: 'cyan', label: 'Cyan', hex: '#06b6d4' },
  { id: 'emerald', label: 'Emerald', hex: '#10b981' },
  { id: 'amber', label: 'Amber', hex: '#f59e0b' },
  { id: 'rose', label: 'Rose', hex: '#f43f5e' },
]

function mergePreferences(raw = {}) {
  return {
    ...DEFAULT_PREFERENCES,
    ...raw,
    theme: 'dark',
    notifications: {
      ...DEFAULT_PREFERENCES.notifications,
      ...(raw.notifications || {}),
    },
    backup: {
      ...DEFAULT_PREFERENCES.backup,
      ...(raw.backup || {}),
    },
  }
}

export function readPreferences() {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY)
    return mergePreferences(raw ? JSON.parse(raw) : {})
  } catch {
    return DEFAULT_PREFERENCES
  }
}

export function savePreferences(nextPreferences) {
  if (typeof window === 'undefined') return nextPreferences
  const merged = mergePreferences(nextPreferences)
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(merged))
  return merged
}

export function updatePreferences(updater) {
  const current = readPreferences()
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
  return savePreferences(next)
}

export function applyPreferences(preferences = readPreferences()) {
  if (typeof document === 'undefined') return
  const resolved = mergePreferences(preferences)
  const root = document.documentElement
  root.dataset.theme = 'dark'
  root.dataset.accent = resolved.accent
  root.style.colorScheme = 'dark'
}

export function readActivityLog() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(ACTIVITY_LOG_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function logAccountActivity(action, detail) {
  if (typeof window === 'undefined') return
  const next = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      action,
      detail,
      timestamp: new Date().toISOString(),
    },
    ...readActivityLog(),
  ].slice(0, 40)
  window.localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(next))
}

export function clearActivityLog() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(ACTIVITY_LOG_KEY)
}
