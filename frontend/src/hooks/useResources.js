import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function useResources() {
  const { user } = useAuth()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchResources = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setResources(data ?? [])
    setLoading(false)
  }, [user])

  useEffect(() => { fetchResources() }, [fetchResources])

  const addResource = async (resourceData) => {
    const { data, error } = await supabase
      .from('resources')
      .insert({ ...resourceData, user_id: user.id })
      .select()
      .single()
    if (!error && data) setResources(prev => [data, ...prev])
    return { data, error }
  }

  const deleteResource = async (id) => {
    setResources(prev => prev.filter(r => r.id !== id))
    return supabase.from('resources').delete().eq('id', id)
  }

  const updateResource = async (id, updates) => {
    const { data, error } = await supabase
      .from('resources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (!error && data) setResources(prev => prev.map(r => r.id === id ? data : r))
    return { data, error }
  }

  return { resources, loading, addResource, updateResource, deleteResource, refetch: fetchResources }
}
