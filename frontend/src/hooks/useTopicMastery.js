import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const VALID_STATUSES = new Set(['not_started', 'practicing', 'completed'])

function normalizeTopic(row) {
  return {
    ...row,
    status: VALID_STATUSES.has(row?.status) ? row.status : 'not_started',
  }
}

export function useTopicMastery() {
  const { user } = useAuth()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchTopics = useCallback(async () => {
    if (!user?.id) {
      setTopics([])
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('topic_mastery')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setTopics((data ?? []).map(normalizeTopic))
    setError(null)
    setLoading(false)
  }, [user?.id])

  useEffect(() => {
    fetchTopics()
  }, [fetchTopics])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`realtime:topic_mastery:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'topic_mastery',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchTopics()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTopics, user?.id])

  const addTopic = async ({ subject, status }) => {
    if (!user?.id) return { error: { message: 'Not authenticated' } }

    const payload = {
      user_id: user.id,
      subject: String(subject || '').trim(),
      status: VALID_STATUSES.has(status) ? status : 'not_started',
    }

    const { data, error: insertError } = await supabase
      .from('topic_mastery')
      .insert(payload)
      .select()
      .single()

    if (insertError) return { error: insertError }

    const normalized = normalizeTopic(data)
    setTopics(prev => [...prev, normalized])
    return { data: normalized }
  }

  const updateTopicStatus = async (id, status) => {
    const nextStatus = VALID_STATUSES.has(status) ? status : 'not_started'

    setTopics(prev => prev.map(topic => topic.id === id ? { ...topic, status: nextStatus } : topic))

    const { data, error: updateError } = await supabase
      .from('topic_mastery')
      .update({ status: nextStatus })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      fetchTopics()
      return { error: updateError }
    }

    return { data: normalizeTopic(data) }
  }

  const deleteTopic = async (id) => {
    setTopics(prev => prev.filter(topic => topic.id !== id))

    const { error: deleteError } = await supabase
      .from('topic_mastery')
      .delete()
      .eq('id', id)

    if (deleteError) {
      fetchTopics()
      return { error: deleteError }
    }

    return { success: true }
  }

  return {
    topics,
    loading,
    error,
    addTopic,
    updateTopicStatus,
    deleteTopic,
    refetch: fetchTopics,
  }
}
