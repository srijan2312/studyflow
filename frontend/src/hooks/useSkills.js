import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function deserializeSkill(skill) {
  if (!skill) return skill

  return {
    ...skill,
    skill_name: skill.skill_name ?? skill.name ?? '',
    progress: skill.progress ?? skill.proficiency ?? 0,
    difficulty_rating: skill.difficulty_rating ?? skill.difficulty ?? 3,
  }
}

function normalizeSkillPayload(skillData) {
  return {
    name: skillData.skill_name?.trim(),
    category: skillData.category?.trim() || null,
    proficiency: Number(skillData.progress ?? 0),
    target_proficiency: Number(skillData.target_proficiency ?? 100),
    hours_spent: Number(skillData.hours_spent ?? 0),
    difficulty: Number(skillData.difficulty_rating ?? 3),
    color: skillData.color ?? null,
  }
}

export function useSkills() {
  const { user } = useAuth()
  const [skills, setSkills] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSkills = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      setSkills((data ?? []).map(deserializeSkill))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => { fetchSkills() }, [fetchSkills])

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`realtime:skills:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'skills',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchSkills()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, fetchSkills])

  const addSkill = async (skillData) => {
    if (!user) return { error: 'Not authenticated' }
    const payload = normalizeSkillPayload(skillData)
    const { data, error } = await supabase
      .from('skills')
      .insert({ ...payload, user_id: user.id })
      .select()
      .single()
    const normalized = data ? deserializeSkill(data) : null
    if (!error && normalized) setSkills(prev => [normalized, ...prev])
    return { data: normalized, error }
  }

  const updateSkill = async (id, updates) => {
    const payload = normalizeSkillPayload(updates)
    setSkills(prev => prev.map(s => s.id === id ? { ...s, ...deserializeSkill({ ...s, ...payload }) } : s))
    const { data, error } = await supabase
      .from('skills')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) fetchSkills()
    return { data: data ? deserializeSkill(data) : null, error }
  }

  const deleteSkill = async (id) => {
    setSkills(prev => prev.filter(s => s.id !== id))
    const { error } = await supabase.from('skills').delete().eq('id', id)
    if (error) fetchSkills()
    return { error }
  }

  return {
    skills,
    loading,
    error,
    addSkill,
    updateSkill,
    deleteSkill,
    refetch: fetchSkills,
  }
}
