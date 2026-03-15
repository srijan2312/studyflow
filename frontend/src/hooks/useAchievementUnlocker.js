import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useStudySessions } from './useStudySessions'
import { useGoals } from './useGoals'
import { useResources } from './useResources'
import { ACHIEVEMENT_DEFINITIONS, getAchievementStats } from '../lib/achievements'

export function useAchievementUnlocker() {
  const { user } = useAuth()
  const { sessions, loading: sessionsLoading } = useStudySessions()
  const { completedGoals, loading: goalsLoading } = useGoals()
  const { resources, loading: resourcesLoading } = useResources()

  const [existingCodes, setExistingCodes] = useState(new Set())
  const [notifications, setNotifications] = useState([])
  const [existingLoaded, setExistingLoaded] = useState(false)
  const checkingRef = useRef(false)
  const notifiedCodesRef = useRef(new Set())

  const loading = sessionsLoading || goalsLoading || resourcesLoading
  const stats = useMemo(
    () => getAchievementStats({ sessions, completedGoals, resources }),
    [completedGoals, resources, sessions]
  )

  useEffect(() => {
    let active = true

    const fetchExisting = async () => {
      if (!user?.id) {
        setExistingCodes(new Set())
        setNotifications([])
        notifiedCodesRef.current = new Set()
        setExistingLoaded(false)
        return
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .select('code')
        .eq('user_id', user.id)

      if (!active) return
      if (!error) {
        const codes = new Set((data ?? []).map(row => row.code))
        setExistingCodes(codes)
        notifiedCodesRef.current = new Set(codes)
        setExistingLoaded(true)
      }
    }

    fetchExisting()
    return () => {
      active = false
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id || loading || !existingLoaded || checkingRef.current) return

    const runCheck = async () => {
      checkingRef.current = true

      const unlockable = ACHIEVEMENT_DEFINITIONS.filter(def =>
        def.isUnlocked(stats) && !existingCodes.has(def.code)
      )

      if (unlockable.length === 0) {
        checkingRef.current = false
        return
      }

      const rows = unlockable.map((def) => ({
        user_id: user.id,
        code: def.code,
        title: def.title,
        description: def.description,
        icon: def.icon,
        category: def.category,
        unlock_condition: def.unlock_condition,
      }))

      const { data, error } = await supabase
        .from('user_achievements')
        .upsert(rows, { onConflict: 'user_id,code' })
        .select('*')

      if (!error) {
        const unlockedNow = (data ?? []).filter(
          row => !existingCodes.has(row.code) && !notifiedCodesRef.current.has(row.code)
        )

        if (unlockedNow.length > 0) {
          unlockedNow.forEach(item => notifiedCodesRef.current.add(item.code))

          setExistingCodes(prev => {
            const next = new Set(prev)
            unlockedNow.forEach(item => next.add(item.code))
            return next
          })

          setNotifications(prev => [
            ...unlockedNow.map(item => ({
              id: `${item.code}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
              code: item.code,
              title: item.title,
              description: item.description,
              icon: item.icon,
              category: item.category,
              created_at: new Date().toISOString(),
            })),
            ...prev,
          ])
        }
      }

      checkingRef.current = false
    }

    runCheck()
  }, [existingCodes, existingLoaded, loading, stats, user?.id])

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(item => item.id !== id))
  }, [])

  return {
    notifications,
    dismissNotification,
    stats,
  }
}
