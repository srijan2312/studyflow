import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { getSessionDuration, toSessionTimestamp } from '../lib/utils'

function getSessionCompletionStorageKey(userId) {
  return `studyflow.session-completion.${userId}`
}

function getSessionMetadataStorageKey(userId) {
  return `studyflow.session-metadata.${userId}`
}

function getSessionCacheStorageKey(userId) {
  return `studyflow.sessions-cache.${userId}`
}

function readSessionCompletionMap(userId) {
  if (!userId || typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(getSessionCompletionStorageKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function readSessionMetadataMap(userId) {
  if (!userId || typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(getSessionMetadataStorageKey(userId))
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeSessionCompletionMap(userId, map) {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getSessionCompletionStorageKey(userId), JSON.stringify(map))
  } catch {
    // Ignore storage write failures.
  }
}

function writeSessionMetadataMap(userId, map) {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getSessionMetadataStorageKey(userId), JSON.stringify(map))
  } catch {
    // Ignore storage write failures.
  }
}

function readCachedSessions(userId) {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getSessionCacheStorageKey(userId))
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCachedSessions(userId, sessions) {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getSessionCacheStorageKey(userId), JSON.stringify(sessions))
  } catch {
    // Ignore storage write failures.
  }
}

function normalizeSessionMetadata(session) {
  const rawTags = Array.isArray(session.tags)
    ? session.tags
    : typeof session.tags === 'string'
      ? session.tags.split(',')
      : []

  return {
    tags: rawTags.map(tag => String(tag).trim()).filter(Boolean),
    focus_rating: Number(session.focus_rating) || 0,
    session_type: session.session_type || 'deep_work',
  }
}

function mergeSessionCompletionState(session, userId) {
  const completionMap = readSessionCompletionMap(userId)
  const metadataMap = readSessionMetadataMap(userId)
  const local = completionMap[session.id]
  const localMetadata = metadataMap[session.id] ?? {}
  const dbCompleted = typeof session.completed === 'boolean' ? session.completed : null
  const normalizedMetadata = normalizeSessionMetadata({ ...session, ...localMetadata })

  return {
    ...session,
    completed: dbCompleted ?? local?.completed ?? false,
    completed_at: session.completed_at ?? local?.completed_at ?? null,
    ...normalizedMetadata,
  }
}

function getMetadataFields(sessionData) {
  return {
    tags: normalizeSessionMetadata(sessionData).tags,
    focus_rating: Number(sessionData.focus_rating) || 0,
    session_type: sessionData.session_type || 'deep_work',
  }
}

function stripMetadataFields(sessionData) {
  const { tags, focus_rating, session_type, ...rest } = sessionData
  return rest
}

export function useStudySessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cacheReady, setCacheReady] = useState(false)

  const fetchSessions = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setSessions((data ?? []).map((session) => mergeSessionCompletionState(session, user.id)))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useLayoutEffect(() => {
    if (!user?.id) {
      setSessions([])
      setCacheReady(false)
      return
    }

    const cached = readCachedSessions(user.id)
    if (cached?.length) {
      setSessions(cached.map((session) => mergeSessionCompletionState(session, user.id)))
      setLoading(false)
    }

    setCacheReady(true)
  }, [user?.id])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  useEffect(() => {
    if (!user?.id || !cacheReady) return
    writeCachedSessions(user.id, sessions)
  }, [user?.id, sessions, cacheReady])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`realtime:study_sessions:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'study_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSessions()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchSessions])

  const normalizeSessionPayload = (sessionData, baseDate = new Date()) => {
    const startTimestamp = toSessionTimestamp(sessionData.start_time, baseDate)
    const endTimestamp = toSessionTimestamp(sessionData.end_time, baseDate)
    const metadata = getMetadataFields(sessionData)

    const normalized = {
      ...sessionData,
      start_time: startTimestamp,
      end_time: endTimestamp,
      ...metadata,
    }

    if (startTimestamp && endTimestamp) {
      const start = new Date(startTimestamp)
      const end = new Date(endTimestamp)
      normalized.duration = Math.max(0, Math.round((end - start) / 60000))
    } else if (typeof sessionData.duration === 'number') {
      normalized.duration = sessionData.duration
    }

    delete normalized.duration_minutes
    return normalized
  }

  const addSession = async (sessionData) => {
    if (!user) return { error: 'Not authenticated' }
    const payload = normalizeSessionPayload(sessionData)
    const metadata = getMetadataFields(payload)
    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimistic = {
      ...payload,
      id: tempId,
      user_id: user.id,
      created_at: new Date().toISOString(),
      completed: false,
      completed_at: null,
    }
    setSessions(prev => [optimistic, ...prev])

    const { data, error } = await supabase
      .from('study_sessions')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()

    if (error?.code === 'PGRST204') {
      const fallbackPayload = stripMetadataFields(payload)
      const retry = await supabase
        .from('study_sessions')
        .insert({ ...fallbackPayload, user_id: user.id })
        .select()
        .single()

      if (retry.error) {
        setSessions(prev => prev.filter(s => s.id !== tempId))
        return { error: retry.error }
      }

      const metadataMap = readSessionMetadataMap(user.id)
      metadataMap[retry.data.id] = metadata
      writeSessionMetadataMap(user.id, metadataMap)
      const merged = mergeSessionCompletionState({ ...retry.data, ...metadata }, user.id)
      setSessions(prev => prev.map(s => s.id === tempId ? merged : s))
      return { data: merged }
    }

    if (error) {
      setSessions(prev => prev.filter(s => s.id !== tempId))
      return { error }
    }

    const metadataMap = readSessionMetadataMap(user.id)
    if (metadataMap[data.id]) {
      delete metadataMap[data.id]
      writeSessionMetadataMap(user.id, metadataMap)
    }
    setSessions(prev => prev.map(s => s.id === tempId ? mergeSessionCompletionState(data, user.id) : s))
    return { data }
  }

  const updateSession = async (id, updates) => {
    const existing = sessions.find(s => s.id === id)
    if (existing?.completed === true) {
      return { error: { message: 'Completed sessions cannot be edited' } }
    }

    const baseDate = existing?.start_time ? new Date(existing.start_time) : existing?.created_at ? new Date(existing.created_at) : new Date()
    const payload = normalizeSessionPayload(updates, baseDate)
    const metadata = getMetadataFields(payload)

    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...payload } : s))
    const { data, error } = await supabase
      .from('study_sessions')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error?.code === 'PGRST204' && user?.id) {
      const retry = await supabase
        .from('study_sessions')
        .update(stripMetadataFields(payload))
        .eq('id', id)
        .select()
        .single()

      if (retry.error) {
        fetchSessions()
        return { error: retry.error }
      }

      const metadataMap = readSessionMetadataMap(user.id)
      metadataMap[id] = metadata
      writeSessionMetadataMap(user.id, metadataMap)
      const merged = mergeSessionCompletionState({ ...retry.data, ...metadata }, user.id)
      setSessions(prev => prev.map(s => s.id === id ? merged : s))
      return { data: merged }
    }

    if (error) {
      fetchSessions()
      return { error }
    }

    if (user?.id) {
      const metadataMap = readSessionMetadataMap(user.id)
      if (metadataMap[id]) {
        delete metadataMap[id]
        writeSessionMetadataMap(user.id, metadataMap)
      }
    }
    return { data }
  }

  const deleteSession = async (id) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', id)
    if (error) {
      fetchSessions()
      return { error }
    }
    return { success: true }
  }

  const toggleSessionCompletion = async (id, isCompleting) => {
    const target = sessions.find(s => s.id === id)
    if (!target || !user) return { error: 'Session not found' }
    if (target.completed === true && isCompleting === false) {
      return { error: { message: 'Completed sessions cannot be marked incomplete' } }
    }

    const completedAt = isCompleting ? new Date().toISOString() : null
    setSessions(prev => prev.map(s => s.id === id ? { ...s, completed: isCompleting, completed_at: completedAt } : s))

    const { data, error } = await supabase
      .from('study_sessions')
      .update({ completed: isCompleting, completed_at: completedAt })
      .eq('id', id)
      .select()
      .single()

    // Backward compatibility when DB columns are not migrated yet.
    if (error?.code === 'PGRST204') {
      const completionMap = readSessionCompletionMap(user.id)
      completionMap[id] = { completed: isCompleting, completed_at: completedAt }
      writeSessionCompletionMap(user.id, completionMap)
      return { data: { ...target, completed: isCompleting, completed_at: completedAt } }
    }

    if (error) {
      fetchSessions()
      return { error }
    }

    // Keep local fallback map in sync by removing stale overrides when DB write works.
    const completionMap = readSessionCompletionMap(user.id)
    if (completionMap[id]) {
      delete completionMap[id]
      writeSessionCompletionMap(user.id, completionMap)
    }

    const merged = mergeSessionCompletionState(data, user.id)
    setSessions(prev => prev.map(s => s.id === id ? merged : s))
    return { data: merged }
  }

  // Today's sessions
  const todaySessions = sessions.filter(s => {
    const d = new Date(s.created_at)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  // Total hours today (minutes → hours)
  const todayMinutes = todaySessions.reduce((acc, s) => {
    return acc + getSessionDuration(s)
  }, 0)

  // Weekly data for charts
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dayStr = d.toDateString()
    const daySessions = sessions.filter(s => new Date(s.created_at).toDateString() === dayStr)
    const minutes = daySessions.reduce((acc, s) => acc + getSessionDuration(s), 0)
    return {
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      hours: parseFloat((minutes / 60).toFixed(1)),
      date: d,
    }
  })

  return {
    sessions,
    todaySessions,
    todayMinutes,
    weeklyData,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    toggleSessionCompletion,
    refetch: fetchSessions,
  }
}
