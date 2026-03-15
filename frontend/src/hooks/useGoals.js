import { useState, useEffect, useCallback, useLayoutEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function getGoalsCacheStorageKey(userId) {
  return `studyflow.goals-cache.${userId}`
}

function readCachedGoals(userId) {
  if (!userId || typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getGoalsCacheStorageKey(userId))
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeCachedGoals(userId, goals) {
  if (!userId || typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getGoalsCacheStorageKey(userId), JSON.stringify(goals))
  } catch {
    // Ignore storage write failures.
  }
}

function sanitizeChecklist(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((item, index) => {
      if (typeof item === 'string') {
        const text = item.trim()
        if (!text) return null
        return { id: `item-${Date.now()}-${index}`, text, completed: false }
      }

      const text = item?.text?.trim?.() ?? ''
      if (!text) return null
      return {
        id: item?.id || `item-${Date.now()}-${index}`,
        text,
        completed: item?.completed === true,
      }
    })
    .filter(Boolean)
}

function encodeChecklist(items) {
  const serialized = JSON.stringify(sanitizeChecklist(items))
  return encodeURIComponent(serialized)
}

function decodeChecklist(rawValue) {
  if (!rawValue) return []
  try {
    const decoded = decodeURIComponent(rawValue)
    return sanitizeChecklist(JSON.parse(decoded))
  } catch {
    return []
  }
}

function extractGoalMetadata(rawDescription) {
  let remaining = rawDescription ?? ''
  let subject = ''
  let checklist = []

  const markerPattern = /^\[\[(subject|checklist):([\s\S]*?)\]\]\n?/
  while (true) {
    const match = remaining.match(markerPattern)
    if (!match) break

    const key = match[1]
    const value = match[2]
    if (key === 'subject') subject = value.trim()
    if (key === 'checklist') checklist = decodeChecklist(value)
    remaining = remaining.slice(match[0].length)
  }

  return {
    subject,
    checklist,
    description: remaining.trim(),
  }
}

function serializeGoalDescription(description, subject, checklist = []) {
  const trimmedDescription = description?.trim() ?? ''
  const trimmedSubject = subject?.trim() ?? ''
  const normalizedChecklist = sanitizeChecklist(checklist)
  const lines = []

  if (trimmedSubject) lines.push(`[[subject:${trimmedSubject}]]`)
  if (normalizedChecklist.length) lines.push(`[[checklist:${encodeChecklist(normalizedChecklist)}]]`)
  if (trimmedDescription) lines.push(trimmedDescription)

  return lines.join('\n').trim()
}

function startOfDay(dateLike) {
  const date = new Date(dateLike)
  date.setHours(0, 0, 0, 0)
  return date
}

function dayDiffInclusive(startDate, endDate) {
  const ms = endDate.getTime() - startDate.getTime()
  const days = Math.floor(ms / 86400000) + 1
  return Math.max(days, 1)
}

function calculateGoalProgress(goal) {
  const checklist = sanitizeChecklist(goal.checklist)
  if (checklist.length > 0) {
    const completed = checklist.filter((item) => item.completed === true).length
    return Math.min(100, Math.round((completed / checklist.length) * 100))
  }

  const isCompleted = goal.status === 'completed' || goal.completed === true
  if (isCompleted) return 100

  if (!goal.target_date) return Number(goal.progress ?? 0)

  const createdDate = startOfDay(goal.created_at ?? new Date())
  const deadlineDate = startOfDay(goal.target_date)
  if (Number.isNaN(deadlineDate.getTime())) return Number(goal.progress ?? 0)

  const totalDays = dayDiffInclusive(createdDate, deadlineDate)
  const today = startOfDay(new Date())
  const elapsedCompletedDays = Math.max(
    Math.floor((today.getTime() - createdDate.getTime()) / 86400000),
    0
  )
  const completedDays = Math.min(elapsedCompletedDays, totalDays)
  return Math.min(100, Math.round((completedDays / totalDays) * 100))
}

function deserializeGoal(goal) {
  if (!goal) return goal

  const metadata = extractGoalMetadata(goal.description ?? '')
  const progressFromChecklist = calculateGoalProgress({ ...goal, checklist: metadata.checklist })
  const resolvedProgress = metadata.checklist.length > 0
    ? progressFromChecklist
    : Number(goal.progress ?? 0)
  const isCompleted = goal.status === 'completed' || goal.completed === true || resolvedProgress >= 100

  return {
    ...goal,
    subject: metadata.subject,
    checklist: metadata.checklist,
    description: metadata.description,
    deadline: goal.target_date ?? '',
    progress: resolvedProgress,
    completed: isCompleted,
    status: isCompleted ? 'completed' : (goal.status ?? 'pending'),
    completed_at: goal.completed_at ?? null,
  }
}

export function useGoals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [cacheReady, setCacheReady] = useState(false)

  const fetchGoals = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (goalError) throw goalError
      const normalized = (goalData ?? []).map((goal) => deserializeGoal(goal))

      setGoals(normalized)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useLayoutEffect(() => {
    if (!user?.id) {
      setGoals([])
      setCacheReady(false)
      return
    }

    const cached = readCachedGoals(user.id)
    if (cached?.length) {
      setGoals(cached.map((goal) => deserializeGoal(goal)))
      setLoading(false)
    }

    setCacheReady(true)
  }, [user?.id])

  useEffect(() => { fetchGoals() }, [fetchGoals])

  useEffect(() => {
    if (!user?.id || !cacheReady) return
    writeCachedGoals(user.id, goals)
  }, [user?.id, goals, cacheReady])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`realtime:goals:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchGoals()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchGoals])

  useEffect(() => {
    if (!user?.id) return

    let intervalId
    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 2, 0)
    const timeoutMs = nextMidnight.getTime() - now.getTime()

    const timeoutId = setTimeout(() => {
      fetchGoals()
      intervalId = setInterval(fetchGoals, 86400000)
    }, Math.max(timeoutMs, 1000))

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [user?.id, fetchGoals])

  const normalizeGoalPayload = (goalData) => {
    const normalizedChecklist = sanitizeChecklist(goalData.checklist)
    const progress = calculateGoalProgress({ ...goalData, checklist: normalizedChecklist })
    const completed = progress >= 100

    return {
      title: goalData.title?.trim(),
      description: serializeGoalDescription(goalData.description, goalData.subject, normalizedChecklist),
      priority: goalData.priority || 'medium',
      target_date: goalData.target_date || goalData.deadline || null,
      progress,
      completed,
    }
  }

  const addGoal = async (goalData) => {
    if (!user) return { error: 'Not authenticated' }
    const payload = {
      ...normalizeGoalPayload(goalData),
    }
    const tempId = `temp-${Date.now()}`
    const optimistic = deserializeGoal({
      ...payload,
      id: tempId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    })
    setGoals(prev => [optimistic, ...prev])

    const { data, error } = await supabase
      .from('goals')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()

    if (error) {
      setGoals(prev => prev.filter(g => g.id !== tempId))
      return { error }
    }
    const normalized = deserializeGoal(data)
    setGoals(prev => prev.map(g => g.id === tempId ? normalized : g))
    return { data: normalized }
  }

  const updateGoal = async (id, updates) => {
    const existing = goals.find(g => g.id === id)
    if (existing?.completed === true || existing?.status === 'completed' || Number(existing?.progress ?? 0) >= 100) {
      return { error: { message: 'Completed goals cannot be edited' } }
    }

    const payload = normalizeGoalPayload(updates)
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...deserializeGoal({ ...g, ...payload }) } : g))
    const { data, error } = await supabase
      .from('goals')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      fetchGoals()
      return { error }
    }
    return { data: deserializeGoal(data) }
  }

  const deleteGoal = async (id) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    const { error } = await supabase.from('goals').delete().eq('id', id)
    if (error) {
      fetchGoals()
      return { error }
    }
    return { success: true }
  }

  const toggleGoalCompletion = async (id, isCompleting) => {
    const goal = goals.find(g => g.id === id)
    if (!goal) return { error: 'Goal not found' }

    const nextProgress = isCompleting ? 100 : Math.min(Number(goal.progress ?? 0), 99)
    const completedAt = isCompleting ? new Date().toISOString() : null

    // Optimistic update
    const updatedGoal = {
      ...goal,
      status: isCompleting ? 'completed' : 'pending',
      completed_at: completedAt,
      completed: isCompleting,
      progress: nextProgress,
    }
    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g))

    // Database update
    const payload = {
      status: isCompleting ? 'completed' : 'pending',
      completed_at: completedAt,
      completed: isCompleting,
      progress: nextProgress,
    }

    const { data, error } = await supabase
      .from('goals')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    // Backward compatibility: if new columns are not in schema yet, retry with legacy fields only.
    if (error?.code === 'PGRST204') {
      const { data: legacyData, error: legacyError } = await supabase
        .from('goals')
        .update({ completed: isCompleting, progress: nextProgress })
        .eq('id', id)
        .select()
        .single()

      if (legacyError) {
        fetchGoals()
        return { error: legacyError }
      }

      return {
        data: deserializeGoal({
          ...legacyData,
          status: isCompleting ? 'completed' : 'pending',
          completed_at: completedAt,
        }),
      }
    }

    if (error) {
      // Rollback on error
      fetchGoals()
      return { error }
    }

    return { data: deserializeGoal(data) }
  }

  const completedGoals = goals.filter(g => g.status === 'completed' || g.completed === true || g.progress >= 100)
  const activeGoals = goals.filter(g => g.status !== 'completed' && g.completed !== true && g.progress < 100)

  return {
    goals,
    completedGoals,
    activeGoals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleGoalCompletion,
    refetch: fetchGoals,
  }
}
