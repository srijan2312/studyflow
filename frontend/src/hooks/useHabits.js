import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function startOfMonth(dateLike) {
  const date = new Date(dateLike)
  date.setDate(1)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfMonth(dateLike) {
  const date = new Date(dateLike)
  date.setMonth(date.getMonth() + 1, 0)
  date.setHours(23, 59, 59, 999)
  return date
}

function toIsoDate(dateLike) {
  const date = new Date(dateLike)
  return date.toISOString().slice(0, 10)
}

function toHabitErrorMessage(err) {
  if (!err) return 'Failed to load habits'

  const message = err.message ?? 'Failed to load habits'
  if (err.code === 'PGRST205' || err.status === 404 || /habit_logs|habits/i.test(message)) {
    return 'Habit Tracker tables are missing in Supabase. Run the SQL for habits and habit_logs in the Supabase SQL Editor, then refresh this page.'
  }

  return message
}

export function useHabits(viewDate = new Date()) {
  const { user } = useAuth()
  const [habits, setHabits] = useState([])
  const [habitLogs, setHabitLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const range = useMemo(() => {
    const start = startOfMonth(viewDate)
    const end = endOfMonth(viewDate)
    return {
      start,
      end,
      startKey: toIsoDate(start),
      endKey: toIsoDate(end),
    }
  }, [viewDate])

  const fetchHabits = useCallback(async () => {
    if (!user?.id) {
      setHabits([])
      setHabitLogs([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [{ data: habitsData, error: habitsError }, { data: logsData, error: logsError }] = await Promise.all([
        supabase
          .from('habits')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('habit_logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', range.startKey)
          .lte('date', range.endKey)
          .order('date', { ascending: true }),
      ])

      if (habitsError) throw habitsError
      if (logsError) throw logsError

      setHabits(habitsData ?? [])
      setHabitLogs(logsData ?? [])
    } catch (err) {
      setHabits([])
      setHabitLogs([])
      setError(toHabitErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [range.endKey, range.startKey, user?.id])

  useEffect(() => {
    fetchHabits()
  }, [fetchHabits])

  useEffect(() => {
    if (!user?.id) return

    const habitsChannel = supabase
      .channel(`realtime:habits:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${user.id}`,
        },
        fetchHabits
      )
      .subscribe()

    const logsChannel = supabase
      .channel(`realtime:habit_logs:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_logs',
          filter: `user_id=eq.${user.id}`,
        },
        fetchHabits
      )
      .subscribe()

    return () => {
      supabase.removeChannel(habitsChannel)
      supabase.removeChannel(logsChannel)
    }
  }, [fetchHabits, user?.id])

  const addHabit = async (habitData) => {
    if (!user?.id) return { error: { message: 'Not authenticated' } }

    const payload = {
  title: habitData.title?.trim(),
  description: habitData.description?.trim() || '',
  frequency: habitData.frequency || 'daily',
  start_date: habitData.start_date,
  reminder_time: habitData.reminder_time || null,
  weekly_day: habitData.weekly_day ?? null,
  custom_days: habitData.custom_days ?? [],
  user_id: user.id,
}

    const { data, error: insertError } = await supabase
      .from('habits')
      .insert(payload)
      .select()
      .single()

    if (!insertError && data) {
      setHabits((current) => [data, ...current])
    }

    return { data, error: insertError ? { ...insertError, message: toHabitErrorMessage(insertError) } : null }
  }

  const updateHabit = async (id, updates) => {
    const payload = {
  title: updates.title?.trim(),
  description: updates.description?.trim() || '',
  frequency: updates.frequency || 'daily',
  start_date: updates.start_date,
  reminder_time: updates.reminder_time || null,
  weekly_day: updates.weekly_day ?? null,
  custom_days: updates.custom_days ?? [],
}

    const { data, error: updateError } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (!updateError && data) {
      setHabits((current) => current.map((habit) => (habit.id === id ? data : habit)))
    }

    return { data, error: updateError ? { ...updateError, message: toHabitErrorMessage(updateError) } : null }
  }

  const deleteHabit = async (id) => {
    setHabits((current) => current.filter((habit) => habit.id !== id))
    setHabitLogs((current) => current.filter((log) => log.habit_id !== id))

    const { error: deleteError } = await supabase.from('habits').delete().eq('id', id)
    if (deleteError) {
      fetchHabits()
      return { error: deleteError }
    }

    return { success: true }
  }

  const upsertHabitLog = async ({ habitId, date, status }) => {
    if (!user?.id) return { error: { message: 'Not authenticated' } }

    const dateKey = toIsoDate(date)
    const existing = habitLogs.find((log) => log.habit_id === habitId && log.date === dateKey)

    if (status === 'pending') {
      if (!existing) return { success: true }

      setHabitLogs((current) => current.filter((log) => log.id !== existing.id))
      const { error: deleteError } = await supabase.from('habit_logs').delete().eq('id', existing.id)
      if (deleteError) {
        fetchHabits()
        return { error: { ...deleteError, message: toHabitErrorMessage(deleteError) } }
      }
      return { success: true }
    }

    const payload = {
      habit_id: habitId,
      user_id: user.id,
      date: dateKey,
      status,
    }

    const { data, error: upsertError } = await supabase
      .from('habit_logs')
      .upsert(payload, { onConflict: 'habit_id,date' })
      .select()
      .single()

    if (!upsertError && data) {
      setHabitLogs((current) => {
        const withoutOld = current.filter((log) => !(log.habit_id === habitId && log.date === dateKey))
        return [...withoutOld, data].sort((a, b) => a.date.localeCompare(b.date))
      })
    }

    return { data, error: upsertError ? { ...upsertError, message: toHabitErrorMessage(upsertError) } : null }
  }

  return {
    habits,
    habitLogs,
    loading,
    error,
    addHabit,
    updateHabit,
    deleteHabit,
    upsertHabitLog,
    refetch: fetchHabits,
  }
}
