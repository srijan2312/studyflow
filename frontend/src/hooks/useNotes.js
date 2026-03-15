import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useNotes() {
  const { user } = useAuth()
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotes = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    setNotes(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`realtime:notes:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotes()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchNotes])

  const addNote = async (noteData) => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ ...noteData, user_id: user.id })
      .select()
      .single()
    if (!error && data) setNotes(prev => [data, ...prev])
    return { data, error }
  }

  const updateNote = async (id, updates) => {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setNotes(prev => prev.map(n => n.id === id ? data : n))
    return { data, error }
  }

  const deleteNote = async (id) => {
    setNotes(prev => prev.filter(n => n.id !== id))
    return supabase.from('notes').delete().eq('id', id)
  }

  return { notes, loading, addNote, updateNote, deleteNote, refetch: fetchNotes }
}
