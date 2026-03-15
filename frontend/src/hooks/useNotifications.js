import { useEffect, useMemo, useState } from 'react'
import { Trophy, Target, Flame, Clock3, AlertTriangle, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAchievementUnlocker } from './useAchievementUnlocker'
import { useGoals } from './useGoals'
import { useStudySessions } from './useStudySessions'
import { formatDuration } from '../lib/utils'

function getReadStorageKey(userId) {
  return `studyflow.notifications.read.${userId}`
}

function readReadIds(userId) {
  if (!userId || typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(getReadStorageKey(userId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeReadIds(userId, ids) {
  if (!userId || typeof window === 'undefined') return
  try {
    const uniqueIds = [...new Set(ids)].slice(0, 200)
    window.localStorage.setItem(getReadStorageKey(userId), JSON.stringify(uniqueIds))
  } catch {
    // Ignore localStorage failures.
  }
}

function startOfDay(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function getTodaySessions(sessions) {
  const today = startOfDay()
  return sessions.filter((session) => startOfDay(session.created_at).getTime() === today.getTime())
}

function getYesterdaySessions(sessions) {
  const yesterday = startOfDay()
  yesterday.setDate(yesterday.getDate() - 1)
  return sessions.filter((session) => startOfDay(session.created_at).getTime() === yesterday.getTime())
}

function getStreakCount(sessions) {
  const uniqueDays = new Set(
    sessions.map((session) => startOfDay(session.created_at).toISOString())
  )

  let streak = 0
  let cursor = startOfDay()
  while (uniqueDays.has(cursor.toISOString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function getGoalMilestone(progress) {
  const value = Number(progress ?? 0)
  if (value >= 100) return 100
  if (value >= 75) return 75
  if (value >= 50) return 50
  if (value >= 25) return 25
  return 0
}

function buildNotificationFeed({ achievementNotifications, goals, activeGoals, completedGoals, sessions }) {
  const today = new Date()
  const todayKey = startOfDay(today).toISOString()
  const todaySessions = getTodaySessions(sessions)
  const yesterdaySessions = getYesterdaySessions(sessions)
  const todayMinutes = todaySessions.reduce((sum, session) => sum + Number(session.duration ?? session.duration_minutes ?? 0), 0)
  const yesterdayMinutes = yesterdaySessions.reduce((sum, session) => sum + Number(session.duration ?? session.duration_minutes ?? 0), 0)
  const streak = getStreakCount(sessions)
  const feed = []

  if (todaySessions.length === 0) {
    feed.push({
      id: `study-reminder-${todayKey}`,
      type: 'reminder',
      title: 'Study reminder',
      message: 'You haven’t logged any study session today.',
      when: today,
      route: '/app/tracker',
      icon: Clock3,
      tone: 'amber',
    })

    const firstGoal = activeGoals[0]
    if (firstGoal) {
      feed.push({
        id: `goal-reminder-${firstGoal.id}-${todayKey}`,
        type: 'reminder',
        title: 'Goal reminder',
        message: `Reminder: Continue your ${firstGoal.title} goal.`,
        when: today,
        route: '/app/goals',
        icon: BookOpen,
        tone: 'indigo',
      })
    }
  }

  goals.forEach((goal) => {
    const milestone = getGoalMilestone(goal.progress)
    const eventTime = new Date(goal.completed_at || goal.updated_at || goal.created_at || today)
    if (milestone === 100) {
      feed.push({
        id: `goal-complete-${goal.id}`,
        type: 'goal',
        title: 'Goal completed',
        message: `Goal completed: ${goal.title}.`,
        when: eventTime,
        route: '/app/goals',
        icon: Target,
        tone: 'emerald',
      })
    } else if (milestone > 0) {
      feed.push({
        id: `goal-milestone-${goal.id}-${milestone}`,
        type: 'goal',
        title: 'Goal update',
        message: `Your ${goal.title} goal is now ${milestone}% complete.`,
        when: eventTime,
        route: '/app/goals',
        icon: Target,
        tone: 'cyan',
      })
    }
  })

  if (streak > 0) {
    const latestSession = sessions[0]
    feed.push({
      id: `streak-progress-${streak}`,
      type: 'streak',
      title: `Study streak: ${streak} day${streak === 1 ? '' : 's'}`,
      message: 'Keep it going!',
      when: latestSession ? new Date(latestSession.created_at) : today,
      route: '/app/tracker',
      icon: Flame,
      tone: 'rose',
    })
  }

  if (todaySessions.length === 0 && streak > 0) {
    feed.push({
      id: `streak-warning-${todayKey}`,
      type: 'streak',
      title: 'Streak warning',
      message: 'Study today to maintain your streak.',
      when: today,
      route: '/app/tracker',
      icon: AlertTriangle,
      tone: 'amber',
    })
  }

  if (sessions[0]) {
    const latestSession = sessions[0]
    let summaryMessage = `You studied ${formatDuration(todayMinutes)} today.`
    if (yesterdayMinutes > 0) {
      const change = Math.round(((todayMinutes - yesterdayMinutes) / yesterdayMinutes) * 100)
      if (change > 0) summaryMessage = `You studied ${change}% more than yesterday.`
      if (change < 0) summaryMessage = `You studied ${Math.abs(change)}% less than yesterday.`
    }

    feed.push({
      id: `study-summary-${latestSession.id}`,
      type: 'summary',
      title: 'Study summary',
      message: summaryMessage,
      when: new Date(latestSession.created_at),
      route: '/app/tracker',
      icon: Clock3,
      tone: 'cyan',
    })
  }

  achievementNotifications.forEach((item) => {
    feed.push({
      id: `achievement-${item.code}`,
      type: 'achievement',
      title: `Achievement unlocked: ${item.title}`,
      message: item.description || 'New achievement unlocked.',
      when: new Date(item.created_at || today),
      route: '/app/achievements',
      icon: Trophy,
      tone: 'emerald',
    })
  })

  return feed
    .filter((item) => item.when && !Number.isNaN(item.when.getTime()))
    .sort((a, b) => b.when - a.when)
    .slice(0, 10)
}

export function useNotifications() {
  const { user } = useAuth()
  const { notifications: achievementNotifications } = useAchievementUnlocker()
  const { goals, activeGoals, completedGoals } = useGoals()
  const { sessions } = useStudySessions()

  const [readIds, setReadIds] = useState(() => readReadIds(user?.id))

  useEffect(() => {
    setReadIds(readReadIds(user?.id))
  }, [user?.id])

  const notifications = useMemo(
    () => buildNotificationFeed({ achievementNotifications, goals, activeGoals, completedGoals, sessions }),
    [achievementNotifications, goals, activeGoals, completedGoals, sessions]
  )

  const markAsRead = (id) => {
    if (!user?.id) return
    setReadIds((current) => {
      if (current.includes(id)) return current
      const next = [id, ...current]
      writeReadIds(user.id, next)
      return next
    })
  }

  const markAllAsRead = () => {
    if (!user?.id) return
    const ids = [...new Set([...notifications.map((item) => item.id), ...readIds])]
    setReadIds(ids)
    writeReadIds(user.id, ids)
  }

  const items = notifications.map((item) => ({
    ...item,
    unread: !readIds.includes(item.id),
  }))

  return {
    notifications: items,
    unreadCount: items.filter((item) => item.unread).length,
    markAsRead,
    markAllAsRead,
  }
}
