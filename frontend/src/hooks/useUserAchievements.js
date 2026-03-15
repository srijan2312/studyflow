import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useUserAchievements() {
  const { user } = useAuth()
  const [achievements, setAchievements] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAchievements = useCallback(async () => {
    if (!user?.id) {
      setAchievements([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id)
      .order('unlocked_at', { ascending: false })

    if (!error) setAchievements(data ?? [])
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchAchievements()
  }, [fetchAchievements])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`realtime:user_achievements:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchAchievements()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAchievements, user?.id])

  return { achievements, loading, refetch: fetchAchievements }
}
