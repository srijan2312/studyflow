import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGSAP } from '@gsap/react'
import { gsap } from 'gsap'
import {
  Clock, Target, Flame, Zap, TrendingUp, BookOpen, ArrowRight,
  Plus, CheckCircle2, Circle, BarChart3, Star, Check, AlertCircle, TrendingDown,
  Activity, Calendar, Lightbulb, X
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import Card, { CardContent, CardHeader, CardTitle, StatCard } from '../../components/ui/Card'
import Progress, { CircularProgress } from '../../components/ui/Progress'
import Modal from '../../components/ui/Modal'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { SkeletonCard, SkeletonRow } from '../../components/ui/Skeleton'
import { useAuth } from '../../context/AuthContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useResources } from '../../hooks/useResources'
import { useTopicMastery } from '../../hooks/useTopicMastery'
import { formatDuration, getSessionDuration, getSubjectColor, QUOTES } from '../../lib/utils'

const QUICK_SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Web Development', 'Data Structures', 'Machine Learning', 'History', 'Literature', 'Other']
const QUICK_RESOURCE_CATEGORIES = ['Video', 'Article', 'Course', 'Book', 'PDF', 'Tool', 'Other']

/* ── Custom Recharts tooltip ──────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl p-3 shadow-[0_20px_40px_rgba(0,0,0,0.5)] text-xs">
      <p className="mb-1 text-slate-400">{label}</p>
      <p className="font-bold text-indigo-400">{payload[0].value}h studied</p>
    </div>
  )
}

/* ── Animated Counter Component ──────────────────────── */
function AnimatedCounter({ value, suffix = '', decimals = 0 }) {
  const counterRef = useRef(null)

  useEffect(() => {
    if (!counterRef.current) return
    const target = Number(value) || 0
    const state = { current: 0 }

    const tween = gsap.to(state, {
      current: target,
      duration: 1.35,
      ease: 'power3.out',
      onUpdate: () => {
        const formatted = state.current.toFixed(decimals)
        counterRef.current.textContent = `${formatted}${suffix}`
      },
      onComplete: () => {
        counterRef.current.textContent = `${target.toFixed(decimals)}${suffix}`
      },
    })

    return () => tween.kill()
  }, [value, suffix, decimals])

  return <span ref={counterRef}>{`${Number(value || 0).toFixed(decimals)}${suffix}`}</span>
}

/* ── Daily Progress Ring Component ─────────────────────── */
function DailyProgressRing({ percentage = 0, todayHours = 0, dailyGoal = 6, goalCreditHours = 0 }) {
  const [animatedPercentage, setAnimatedPercentage] = useState(0)
  const circumference = 2 * Math.PI * 45
  const safePercentage = Math.max(0, Math.min(100, Number(percentage) || 0))
  const offset = circumference - (animatedPercentage / 100) * circumference
  const currentHours = Number(todayHours) || 0
  const remainingHours = Math.max(dailyGoal - currentHours, 0)

  useEffect(() => {
    setAnimatedPercentage(0)
    const id = window.setTimeout(() => setAnimatedPercentage(safePercentage), 40)
    return () => window.clearTimeout(id)
  }, [safePercentage])

  const ringState = safePercentage < 40 ? 'low' : safePercentage < 70 ? 'mid' : 'high'
  const ringStyles = {
    low: {
      stroke: 'rgba(248, 113, 113, 0.95)',
      value: 'text-red-400',
      goal: 'text-red-300',
    },
    mid: {
      stroke: 'rgba(250, 204, 21, 0.95)',
      value: 'text-amber-300',
      goal: 'text-amber-300',
    },
    high: {
      stroke: 'rgba(168, 85, 247, 0.95)',
      value: 'text-purple-300',
      goal: 'text-purple-300',
    },
  }[ringState]
  
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <svg className="absolute inset-0 transform -rotate-90" width="128" height="128">
          <circle cx="64" cy="64" r="45" stroke="rgba(148,163,184,0.2)" strokeWidth="8" fill="none" />
          <circle
            cx="64" cy="64" r="45" stroke={ringStyles.stroke} strokeWidth="8" fill="none"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={`text-2xl font-bold ${ringStyles.value}`}>{Math.round(safePercentage)}%</p>
          <p className="text-xs text-slate-500">Today</p>
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm text-slate-300">
          <span className={`font-semibold ${ringStyles.goal}`}>{todayHours}h</span> / {dailyGoal}h
        </p>
        <p className="text-xs text-slate-500">
          {Math.round(safePercentage)}% done today · {remainingHours.toFixed(1)}h left
        </p>
        {goalCreditHours > 0 && (
          <p className="text-[11px] text-slate-600">
            Includes {goalCreditHours.toFixed(1)}h goal completion credit
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Activity Timeline Component ──────────────────────── */
function ActivityTimeline({ sessions, goals }) {
  const activities = []

  sessions.slice(0, 8).forEach((session) => {
    const timestamp = new Date(session.created_at)
    const duration = formatDuration(getSessionDuration(session))
    activities.push({
      type: 'session',
      time: timestamp,
      dayKey: timestamp.toDateString(),
      label: `Logged ${session.topic || 'study'} session (${duration})`,
      meta: session.subject || 'General',
    })
  })

  goals
    .filter((goal) => goal.status === 'completed' || goal.completed === true || (goal.progress ?? 0) >= 100)
    .slice(0, 8)
    .forEach((goal) => {
      const completedStamp = goal.completed_at ?? goal.updated_at ?? goal.created_at
      const timestamp = new Date(completedStamp)
      activities.push({
        type: 'goal',
        time: timestamp,
        dayKey: timestamp.toDateString(),
        label: `Completed ${goal.title} goal`,
        meta: goal.subject || 'Goal',
      })
    })

  activities.sort((a, b) => b.time - a.time)
  const recentActivities = activities.slice(0, 12)

  const grouped = recentActivities.reduce((acc, item) => {
    if (!acc[item.dayKey]) {
      acc[item.dayKey] = {
        date: new Date(item.time),
        items: [],
      }
    }
    acc[item.dayKey].items.push(item)
    return acc
  }, {})

  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const groups = Object.entries(grouped)
    .map(([dayKey, group]) => {
      const date = new Date(group.date)
      let label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (dayKey === today.toDateString()) label = 'Today'
      if (dayKey === yesterday.toDateString()) label = 'Yesterday'
      return { dayKey, label, date, items: group.items }
    })
    .sort((a, b) => b.date - a.date)

  return (
    <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
      {groups.length === 0 ? (
        <div className="py-8 text-center text-slate-600">
          <Activity size={20} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        groups.map((group) => (
          <div key={group.dayKey} className="space-y-2">
            <p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">{group.label}</p>
            <div className="space-y-0">
              {group.items.map((item, idx) => (
                <div key={`${group.dayKey}-${idx}`} className="relative pl-6 pb-4 last:pb-0">
                  {idx < group.items.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-800/60" />}
                  <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border ${item.type === 'goal' ? 'bg-emerald-500/15 border-emerald-400/60' : 'bg-indigo-500/15 border-indigo-400/60'}`} />
                  <p className="text-sm text-slate-300">{item.label}</p>
                  <p className="text-xs text-slate-600">
                    {item.meta} · {item.time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function buildShuffledQuotes(previousText = '') {
  const items = [...QUOTES]

  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = items[i]
    items[i] = items[j]
    items[j] = temp
  }

  if (previousText && items.length > 1 && items[0]?.text === previousText) {
    const swapIndex = 1 + Math.floor(Math.random() * (items.length - 1))
    const temp = items[0]
    items[0] = items[swapIndex]
    items[swapIndex] = temp
  }

  return items
}

const QUOTE_ROTATE_MS = 4000

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { sessions, todaySessions, todayMinutes, weeklyData, loading: sessionsLoading, addSession } = useStudySessions()
  const { goals, activeGoals, completedGoals, loading: goalsLoading, addGoal } = useGoals()
  const { addResource } = useResources()
  const { topics, loading: topicsLoading } = useTopicMastery()

  const [quickModal, setQuickModal] = useState(null)
  const [quickSaving, setQuickSaving] = useState(false)
  const [quickError, setQuickError] = useState('')
  const [quickToast, setQuickToast] = useState(null)
  const [quickToastVisible, setQuickToastVisible] = useState(false)

  const [sessionForm, setSessionForm] = useState({ topic: '', subject: '', start_time: '', end_time: '', notes: '' })
  const [goalForm, setGoalForm] = useState({ title: '', subject: '', deadline: '', priority: 'medium', description: '' })
  const [resourceForm, setResourceForm] = useState({ title: '', category: '', url: '', description: '' })
  const [quoteOrder, setQuoteOrder] = useState(() => buildShuffledQuotes())
  const [quotePointer, setQuotePointer] = useState(0)

  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? 'there'
  const firstName = displayName.split(' ')[0]

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setQuotePointer((prevPointer) => {
        const nextPointer = prevPointer + 1
        if (nextPointer < quoteOrder.length) return nextPointer

        const previousQuoteText = quoteOrder[prevPointer]?.text ?? ''
        setQuoteOrder(buildShuffledQuotes(previousQuoteText))
        return 0
      })
    }, QUOTE_ROTATE_MS)

    return () => window.clearTimeout(timerId)
  }, [quoteOrder, quotePointer])

  const activeQuote = quoteOrder[quotePointer] ?? { text: 'Keep learning every day.', author: 'StudyFlow' }

  // Streak calculation (days with sessions in a row)
  const streak = (() => {
    let count = 0
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const hasSessions = sessions.some(s => new Date(s.created_at).toDateString() === d.toDateString())
      if (hasSessions) count++
      else break
    }
    return count
  })()

  const totalLoggedMinutes = sessions.reduce((acc, session) => acc + getSessionDuration(session), 0)
  const activeStudyDays = Math.max(
    new Set(sessions.map(session => new Date(session.created_at).toDateString())).size,
    1
  )
  const trackerBasedGoalHours = totalLoggedMinutes > 0
    ? totalLoggedMinutes / 60 / activeStudyDays
    : 6

  const todayDateStr = new Date().toDateString()
  const hasSessionCompletionState = sessions.some((session) => session.completed === true)
  const completedTodayMinutes = todaySessions
    .filter((session) => session.completed === true)
    .reduce((acc, session) => acc + getSessionDuration(session), 0)
  const completedTodayGoalsCount = goals.filter((goal) => {
    const isCompleted = goal.status === 'completed' || goal.completed === true || (goal.progress ?? 0) >= 100
    if (!isCompleted) return false
    const completedStamp = goal.completed_at ?? goal.updated_at ?? goal.created_at
    return completedStamp && new Date(completedStamp).toDateString() === todayDateStr
  }).length

  // Each completed goal contributes a small progress credit so ring reacts to goal ticks.
  const goalCompletionCreditMinutes = completedTodayGoalsCount * 20
  const baseTodayMinutes = hasSessionCompletionState ? completedTodayMinutes : todayMinutes
  const effectiveTodayMinutes = baseTodayMinutes + goalCompletionCreditMinutes
  const dailyGoalHours = Math.max(Number(trackerBasedGoalHours.toFixed(1)), 1)
  const dailyGoalMinutes = dailyGoalHours * 60
  const todayProgress = Math.min((effectiveTodayMinutes / dailyGoalMinutes) * 100, 100)
  const remainingGoalMinutes = Math.max(dailyGoalMinutes - effectiveTodayMinutes, 0)
  const recoverySprintCount = Math.ceil(remainingGoalMinutes / 25)
  const recoveryDeepBlocks = Math.ceil(remainingGoalMinutes / 45)
  const nowClock = new Date()
  const endOfToday = new Date(nowClock)
  endOfToday.setHours(23, 59, 59, 999)
  const remainingDayMinutes = Math.max(Math.floor((endOfToday.getTime() - nowClock.getTime()) / 60000), 0)
  const maxPossibleSprints = Math.floor(remainingDayMinutes / 25)
  const maxPossibleDeepBlocks = Math.floor(remainingDayMinutes / 45)
  const canRecoverToday = remainingGoalMinutes <= remainingDayMinutes
  const realisticSprintPlan = Math.min(recoverySprintCount, maxPossibleSprints)
  const realisticDeepPlan = Math.min(recoveryDeepBlocks, maxPossibleDeepBlocks)

  const topicMastery = topics
    .filter((topic) => topic?.subject)
    .map((topic) => {
      const status = topic.status || 'not_started'
      const statusMap = {
        completed: { label: 'Completed', variant: 'emerald', progress: 100 },
        practicing: { label: 'Practicing', variant: 'indigo', progress: 60 },
        not_started: { label: 'Not Started', variant: 'amber', progress: 0 },
      }

      const config = statusMap[status] ?? statusMap.not_started
      const updated = topic.updated_at ? new Date(topic.updated_at) : null
      const freshness = updated && !Number.isNaN(updated.getTime())
        ? updated.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : 'No updates'

      return {
        subject: topic.subject,
        statusLabel: config.label,
        statusVariant: config.variant,
        completionRate: config.progress,
        freshness,
      }
    })
    .sort((a, b) => a.subject.localeCompare(b.subject))
    .slice(0, 5)

  const dailyChallenges = [
    {
      code: 'study_2h',
      title: 'Study for 2 hours',
      progress: effectiveTodayMinutes / 60,
      target: 2,
      unit: 'hours',
      color: 'cyan',
    },
    {
      code: 'complete_1_goal',
      title: 'Complete 1 goal',
      progress: completedTodayGoalsCount,
      target: 1,
      unit: 'goals',
      color: 'emerald',
    },
    {
      code: 'log_2_sessions',
      title: 'Log 2 study sessions',
      progress: todaySessions.length,
      target: 2,
      unit: 'sessions',
      color: 'indigo',
    },
  ].map((item) => ({
    ...item,
    completed: item.progress >= item.target,
    displayProgress: Math.min(item.progress, item.target),
  }))

  const completedDailyChallenges = dailyChallenges.filter((item) => item.completed).length

  // Smart suggestions
  const getSuggestions = () => {
    const suggestions = []

    if (activeGoals.length === 0) {
      suggestions.push({
        type: 'goals-empty',
        message: 'Add one short goal for this week to stay focused.'
      })
    }

    if (todaySessions.length === 0) {
      suggestions.push({
        type: 'sessions-empty',
        message: 'Log one study session today to build momentum.'
      })
    }

    if (streak === 0) {
      suggestions.push({
        type: 'streak',
        message: 'Start a new studying streak! Log a session today.'
      })
    }

    if (suggestions.length === 0) {
      suggestions.push({
        type: 'consistency',
        message: 'Great consistency. Try increasing one session by 15 minutes today.'
      })
    }

    return suggestions.slice(0, 2)
  }

  // Weekly comparison
  const getWeeklyComparison = () => {
    const now = new Date()
    const currentStart = new Date(now)
    currentStart.setHours(0, 0, 0, 0)
    currentStart.setDate(currentStart.getDate() - 6)

    const previousStart = new Date(currentStart)
    previousStart.setDate(previousStart.getDate() - 7)

    const thisWeekMinutes = sessions
      .filter((session) => {
        const ts = new Date(session.created_at)
        return ts >= currentStart && ts <= now
      })
      .reduce((sum, session) => sum + getSessionDuration(session), 0)

    const lastWeekMinutes = sessions
      .filter((session) => {
        const ts = new Date(session.created_at)
        return ts >= previousStart && ts < currentStart
      })
      .reduce((sum, session) => sum + getSessionDuration(session), 0)

    const thisWeek = thisWeekMinutes / 60
    const lastWeek = lastWeekMinutes / 60
    const improvement = lastWeek > 0 ? Math.round(((thisWeek - lastWeek) / lastWeek) * 100) : 0

    return {
      thisWeek,
      lastWeek,
      improvement,
      isUp: improvement > 0,
      isFlat: improvement === 0,
      hasBaseline: lastWeek > 0,
    }
  }

  const containerRef = useRef(null)

  useGSAP(() => {
    gsap.from('.dash-card', {
      opacity: 0,
      y: 20,
      duration: 0.52,
      stagger: 0.08,
      ease: 'power3.out',
      delay: 0.1,
    })

    const chartStrokePath = containerRef.current?.querySelector('.weekly-area-chart path.recharts-curve.recharts-area-curve[fill="none"]')
    if (chartStrokePath) {
      const length = chartStrokePath.getTotalLength()
      gsap.set(chartStrokePath, {
        strokeDasharray: length,
        strokeDashoffset: length,
      })
      gsap.to(chartStrokePath, {
        strokeDashoffset: 0,
        duration: 1.2,
        ease: 'power2.out',
        delay: 0.25,
      })
    }
  }, { scope: containerRef })

  const getHour = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const weeklyComparison = getWeeklyComparison()
  const suggestions = getSuggestions()

  const openQuickModal = (type) => {
    setQuickError('')
    setQuickModal(type)
  }

  const closeQuickModal = () => {
    if (quickSaving) return
    setQuickModal(null)
    setQuickError('')
  }

  const showQuickToast = (type, message) => {
    setQuickToast({ type, message, id: Date.now() })
    setQuickToastVisible(false)
    window.requestAnimationFrame(() => setQuickToastVisible(true))
  }

  const dismissQuickToast = () => {
    setQuickToastVisible(false)
    window.setTimeout(() => {
      setQuickToast(null)
    }, 180)
  }

  useEffect(() => {
    if (!quickToast) return
    const id = window.setTimeout(() => dismissQuickToast(), 2800)
    return () => window.clearTimeout(id)
  }, [quickToast?.id])

  const handleQuickSessionSubmit = async (e) => {
    e.preventDefault()
    if (!sessionForm.topic.trim() || !sessionForm.subject.trim()) {
      setQuickError('Topic and subject are required.')
      showQuickToast('error', 'Topic and subject are required.')
      return
    }
    setQuickSaving(true)
    const { error } = await addSession({
      ...sessionForm,
      topic: sessionForm.topic.trim(),
      subject: sessionForm.subject.trim(),
    })
    setQuickSaving(false)
    if (error) {
      const message = error.message ?? 'Unable to log session'
      setQuickError(message)
      showQuickToast('error', message)
      return
    }
    setSessionForm({ topic: '', subject: '', start_time: '', end_time: '', notes: '' })
    closeQuickModal()
    showQuickToast('success', 'Session logged successfully.')
  }

  const handleQuickGoalSubmit = async (e) => {
    e.preventDefault()
    if (!goalForm.title.trim()) {
      setQuickError('Goal title is required.')
      showQuickToast('error', 'Goal title is required.')
      return
    }
    setQuickSaving(true)
    const { error } = await addGoal({
      ...goalForm,
      title: goalForm.title.trim(),
      subject: goalForm.subject.trim(),
      deadline: goalForm.deadline,
      priority: goalForm.priority,
      description: goalForm.description,
    })
    setQuickSaving(false)
    if (error) {
      const message = error.message ?? 'Unable to add goal'
      setQuickError(message)
      showQuickToast('error', message)
      return
    }
    setGoalForm({ title: '', subject: '', deadline: '', priority: 'medium', description: '' })
    closeQuickModal()
    showQuickToast('success', 'Goal added successfully.')
  }

  const handleQuickResourceSubmit = async (e) => {
    e.preventDefault()
    if (!resourceForm.title.trim() || !resourceForm.url.trim()) {
      setQuickError('Resource title and URL are required.')
      showQuickToast('error', 'Resource title and URL are required.')
      return
    }
    setQuickSaving(true)
    const { error } = await addResource({
      ...resourceForm,
      title: resourceForm.title.trim(),
      url: resourceForm.url.trim(),
    })
    setQuickSaving(false)
    if (error) {
      const message = error.message ?? 'Unable to add resource'
      setQuickError(message)
      showQuickToast('error', message)
      return
    }
    setResourceForm({ title: '', category: '', url: '', description: '' })
    closeQuickModal()
    showQuickToast('success', 'Resource added successfully.')
  }

  return (
    <div ref={containerRef} className="p-6 md:p-8 space-y-8">
      {quickToast && (
        <div className="fixed top-5 right-5 z-[70]">
          <div className={`min-w-[260px] max-w-sm rounded-xl border px-4 py-3 shadow-[0_16px_38px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-all duration-200 ${quickToastVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-2 opacity-0 scale-[0.98]'} ${quickToast.type === 'success' ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-100' : 'border-red-500/40 bg-red-500/12 text-red-100'}`}>
            <div className="flex items-start gap-2.5">
              {quickToast.type === 'success' ? (
                <CheckCircle2 size={16} className="mt-0.5 text-emerald-300" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 text-red-300" />
              )}
              <p className="text-sm leading-5 flex-1">{quickToast.message}</p>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={dismissQuickToast}
                className="mt-0.5 rounded-md p-0.5 text-slate-300/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────── */}
      <div className="dash-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {getHour()}, {firstName} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <Link
          to="/app/tracker"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-sm hover:shadow-glow hover:-translate-y-0.5 transition-all shrink-0"
        >
          <Plus size={15} />
          Log study session
        </Link>
      </div>

      {/* ── Quick Actions ──────────────────────────────────── */}
      <div className="dash-card grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={() => openQuickModal('session')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-700/50 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-sm text-slate-300 font-medium group"
        >
          <Plus size={16} className="group-hover:text-indigo-400" />
          <span className="hidden sm:inline">Log session</span>
          <span className="sm:hidden">Session</span>
        </button>
        <button
          onClick={() => openQuickModal('goal')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-700/50 hover:border-purple-500/50 hover:bg-purple-500/5 transition-all text-sm text-slate-300 font-medium group"
        >
          <Target size={16} className="group-hover:text-purple-400" />
          <span className="hidden sm:inline">Add goal</span>
          <span className="sm:hidden">Goal</span>
        </button>
        <button
          onClick={() => openQuickModal('resource')}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-700/50 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-sm text-slate-300 font-medium group"
        >
          <BookOpen size={16} className="group-hover:text-amber-400" />
          <span className="hidden sm:inline">Resource</span>
          <span className="sm:hidden">Resource</span>
        </button>
      </div>

      {/* ── Stat cards with animated counters ─────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {sessionsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} className="dash-card" />)
        ) : (
          <>
            <div className="dash-card">
              <StatCard
                icon={<Clock size={18} />}
                label="Today's Study"
                value={<AnimatedCounter value={todayMinutes / 60} suffix="h" decimals={1} />}
                color="indigo"
                trendValue={`${todaySessions.length} sessions`}
                trend="up"
              />
            </div>
            <div className="dash-card">
              <StatCard
                icon={<Target size={18} />}
                label="Active Goals"
                value={`${activeGoals.length}`}
                color="purple"
                trendValue={`${goals.filter(g => g.progress >= 100).length} completed`}
                trend="up"
              />
            </div>
            <div className="dash-card">
              <StatCard
                icon={<Flame size={18} />}
                label="Study Streak"
                value={<AnimatedCounter value={streak} suffix=" days" />}
                color="amber"
                trendValue={streak > 0 ? 'Keep it up!' : 'Start today!'}
                trend={streak > 0 ? 'up' : 'down'}
              />
            </div>
            <div className="dash-card">
              <StatCard
                icon={<CheckCircle2 size={18} />}
                label="Completed Goals"
                value={<AnimatedCounter value={completedGoals.length} />}
                color="emerald"
                trendValue={`${activeGoals.length} active goals`}
                trend="up"
              />
            </div>
          </>
        )}
      </div>

      {/* ── Main grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly chart + Daily ring */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="dash-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Study Overview</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">Hours studied per day this week</p>
                </div>
                <Link to="/app/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                  Full analytics <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-48 weekly-area-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                    <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone" dataKey="hours"
                      stroke="#6366f1" strokeWidth={2.5}
                      fill="url(#studyGrad)"
                      dot={{ fill: '#6366f1', strokeWidth: 0, r: 3 }}
                      activeDot={{ r: 5, fill: '#818cf8', strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Weekly Insight */}
          {weeklyComparison && (
            <Card className="dash-card bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 border-indigo-500/20">
              <CardContent className="py-6">
                <div className="flex items-center gap-4">
                  <div className={weeklyComparison.isUp ? 'bg-emerald-500/10' : weeklyComparison.isFlat ? 'bg-slate-500/10' : 'bg-red-500/10'} >
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                      {weeklyComparison.isUp ? (
                        <TrendingUp size={24} className="text-emerald-400" />
                      ) : weeklyComparison.isFlat ? (
                        <BarChart3 size={24} className="text-slate-400" />
                      ) : (
                        <TrendingDown size={24} className="text-red-400" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-300 font-medium">Weekly Productivity</p>
                    {!weeklyComparison.hasBaseline ? (
                      <p className="text-sm text-slate-400">Not enough last-week data yet. Keep logging sessions to unlock comparison.</p>
                    ) : (
                      <p className={`text-sm ${weeklyComparison.isUp ? 'text-emerald-400' : weeklyComparison.isFlat ? 'text-slate-300' : 'text-red-400'}`}>
                        {weeklyComparison.isFlat
                          ? 'You studied the same as last week.'
                          : `You studied ${Math.abs(weeklyComparison.improvement)}% ${weeklyComparison.isUp ? 'more' : 'less'} than last week`}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">This week: <span className="text-slate-300 font-medium">{weeklyComparison.thisWeek.toFixed(1)}h</span></p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Quote */}
          <Card className="dash-card bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10">
            <CardContent className="py-5">
              <div className="flex gap-2 mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-sm text-slate-300 leading-relaxed italic">"{activeQuote.text}"</p>
              <p className="text-xs text-slate-500 mt-3">— {activeQuote.author}</p>
            </CardContent>
          </Card>

          {/* Recovery Meter */}
          <Card className="dash-card border-rose-500/20 bg-rose-500/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-400" />
                <CardTitle className="text-sm">Recovery Meter</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {remainingGoalMinutes === 0 ? (
                <>
                  <p className="text-sm text-emerald-300">Daily target complete. You are on track.</p>
                  <p className="text-xs text-slate-500">Use extra time for revision or note cleanup.</p>
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-300">
                    You are <span className="text-rose-300 font-semibold">{formatDuration(remainingGoalMinutes)}</span> behind today&apos;s target.
                  </p>
                  <div className="rounded-lg border border-slate-700/60 bg-slate-900/60 p-3 space-y-1.5">
                    <p className="text-xs text-slate-400">Catch-up plan</p>
                    {canRecoverToday ? (
                      <>
                        <p className="text-xs text-slate-300">{recoverySprintCount} x 25m sprint sessions</p>
                        <p className="text-xs text-slate-300">or {recoveryDeepBlocks} x 45m deep-focus blocks</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-amber-300">Only {formatDuration(remainingDayMinutes)} left today.</p>
                        <p className="text-xs text-slate-300">Realistic now: {realisticSprintPlan} x 25m sprints</p>
                        <p className="text-xs text-slate-300">or {realisticDeepPlan} x 45m deep-focus blocks</p>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => navigate('/app/tracker')}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700/60 text-xs text-slate-300 hover:text-white hover:border-rose-500/60 transition-colors"
                  >
                    Start catch-up session
                    <ArrowRight size={12} />
                  </button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Daily Progress Ring + Suggestions */}
        <div className="space-y-6">
          {/* Daily progress ring */}
          <Card className="dash-card flex items-center justify-center py-8">
            <DailyProgressRing
              percentage={todayProgress}
              todayHours={(effectiveTodayMinutes / 60).toFixed(1)}
              dailyGoal={dailyGoalHours}
              goalCreditHours={goalCompletionCreditMinutes / 60}
            />
          </Card>

          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <Card className="dash-card border-amber-500/20 bg-amber-500/5">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb size={16} className="text-amber-500" />
                  <CardTitle className="text-sm">Smart Suggestions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {suggestions.map((sugg, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-amber-500/10">
                    <p className="text-xs text-slate-300">{sugg.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Daily Challenges Widget */}
          <Card className="dash-card border-cyan-500/20 bg-cyan-500/5">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-cyan-400" />
                  <CardTitle className="text-sm">Daily Challenges</CardTitle>
                </div>
                <span className="text-xs text-cyan-300">{completedDailyChallenges}/3 done</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {dailyChallenges.map((challenge) => (
                <div key={challenge.code} className="rounded-lg border border-slate-700/50 bg-slate-900/45 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-slate-300">{challenge.title}</p>
                    {challenge.completed ? (
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    ) : (
                      <Circle size={13} className="text-slate-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Progress: {challenge.displayProgress.toFixed(challenge.unit === 'hours' ? 1 : 0)} / {challenge.target} {challenge.unit}
                  </p>
                  <Progress
                    value={challenge.displayProgress}
                    max={challenge.target}
                    size="xs"
                    color={challenge.completed ? 'emerald' : challenge.color}
                    className="mt-2"
                  />
                </div>
              ))}

              <button
                onClick={() => navigate('/app/challenges')}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900/70 border border-slate-700/60 text-xs text-slate-300 hover:text-white hover:border-cyan-500/60 transition-colors"
              >
                Open Daily Challenges
                <ArrowRight size={12} />
              </button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* ── Goals + Activity Timeline ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Goals */}
        <Card className="dash-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Today's Goals</CardTitle>
              <Link to="/app/goals">
                <ArrowRight size={15} className="text-slate-600 hover:text-slate-400 transition-colors" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {goalsLoading ? (
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
            ) : activeGoals.length === 0 ? (
              <div className="py-8 text-center">
                <Target size={28} className="text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600 mb-2">No active goals</p>
                <button
                  onClick={() => navigate('/app/goals')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-medium"
                >
                  <Plus size={13} />
                  Create a goal
                </button>
              </div>
            ) : (
              activeGoals.slice(0, 5).map(goal => (
                <div
                  key={goal.id}
                  className="w-full flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-slate-800/40 transition-colors group border border-transparent hover:border-slate-700/50"
                >
                  <div className="mt-0.5 shrink-0">
                    <div className="relative w-6 h-6 rounded-xl flex items-center justify-center bg-slate-900/70 border border-slate-700/80 group-hover:border-indigo-500/50 transition-all">
                      <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-indigo-400/70 transition-colors" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-slate-300">{goal.title}</p>
                    <p className="text-xs text-slate-600">{goal.subject}</p>
                    <Progress value={goal.progress} max={100} size="xs" color="indigo" className="mt-1.5" />
                  </div>
                  <span className="text-xs text-slate-600 shrink-0 tabular-nums">{goal.progress}%</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="dash-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-slate-500" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ActivityTimeline sessions={sessions} goals={goals} />
          </CardContent>
        </Card>
      </div>

      {/* ── Completed Goals Section ────────────────────────── */}
      {completedGoals.length > 0 && (
        <Card className="dash-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <CardTitle>Completed Goals ({completedGoals.length})</CardTitle>
              </div>
              <Link to="/app/goals">
                <ArrowRight size={15} className="text-slate-600 hover:text-slate-400 transition-colors" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {completedGoals.slice(0, 10).map(goal => (
              <div
                key={goal.id}
                className="w-full flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-slate-800/40 transition-colors group border border-transparent hover:border-slate-700/50"
              >
                <div className="mt-0.5 shrink-0">
                  <div className="relative w-6 h-6 rounded-xl bg-gradient-to-br from-emerald-500/25 to-cyan-500/20 border border-emerald-400/60 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.25)]">
                    <Check size={13} className="text-emerald-300" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm line-through text-slate-600">
                    {goal.title}
                  </p>
                  <p className="text-xs text-slate-600">{goal.subject}</p>
                  {goal.completed_at && (
                    <p className="text-xs text-emerald-600/80 mt-1">
                      Completed {new Date(goal.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── Recent Sessions + Quote ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent sessions */}
        <Card className="dash-card lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Sessions</CardTitle>
              <Link to="/app/tracker" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {sessionsLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
              </div>
            ) : sessions.length === 0 ? (
              <div className="py-10 text-center">
                <BookOpen size={32} className="text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-600 mb-2">No study sessions yet</p>
                <button
                  onClick={() => navigate('/app/tracker')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors text-xs font-medium"
                >
                  <Plus size={13} />
                  Log your first session
                </button>
              </div>
            ) : (
              <div className="space-y-0.5">
                {sessions.slice(0, 6).map(session => {
                  const color = getSubjectColor(session.subject)
                  const duration = getSessionDuration(session)
                  return (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 py-3 px-2 rounded-xl hover:bg-slate-800/40 transition-colors group"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: `${color}20`, color }}
                      >
                        {(session.subject ?? 'GN').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{session.topic}</p>
                        <p className="text-xs text-slate-500">{session.subject}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-slate-400">{formatDuration(duration)}</p>
                        <p className="text-[10px] text-slate-700">
                          {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Topic mastery */}
        <div className="space-y-4">
          <Card className="dash-card">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-cyan-400" />
                <CardTitle>Topic Mastery Checkpoints</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topicsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
              ) : topicMastery.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-sm text-slate-500">No checkpoints yet</p>
                  <p className="text-xs text-slate-600 mt-1">Log a few sessions to unlock mastery levels.</p>
                </div>
              ) : (
                topicMastery.map((item) => (
                  <div key={item.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-slate-300 truncate">{item.subject}</p>
                      <Badge variant={item.statusVariant} className="text-[10px]">{item.statusLabel}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Last update: {item.freshness}</span>
                      <span>{item.completionRate}%</span>
                    </div>
                    <Progress value={item.completionRate} size="sm" color={item.statusVariant === 'emerald' ? 'emerald' : item.statusVariant === 'amber' ? 'amber' : 'indigo'} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={quickModal === 'session'}
        onClose={closeQuickModal}
        title="Log Study Session"
        description="Track what you just studied"
      >
        <form onSubmit={handleQuickSessionSubmit} className="space-y-4">
          <Input label="Study Topic *" value={sessionForm.topic} onChange={(e) => setSessionForm(prev => ({ ...prev, topic: e.target.value }))} placeholder="e.g. React Hooks" />
          <Select label="Subject" value={sessionForm.subject} onChange={(e) => setSessionForm(prev => ({ ...prev, subject: e.target.value }))}>
            <option value="">Select subject...</option>
            {QUICK_SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="time" label="Start Time" value={sessionForm.start_time} onChange={(e) => setSessionForm(prev => ({ ...prev, start_time: e.target.value }))} />
            <Input type="time" label="End Time" value={sessionForm.end_time} onChange={(e) => setSessionForm(prev => ({ ...prev, end_time: e.target.value }))} />
          </div>
          <Textarea label="Notes (optional)" rows={3} placeholder="What did you learn? Any key takeaways?" value={sessionForm.notes} onChange={(e) => setSessionForm(prev => ({ ...prev, notes: e.target.value }))} />
          {quickError && <p className="text-xs text-red-400">{quickError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeQuickModal}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={quickSaving}>Save session</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={quickModal === 'goal'}
        onClose={closeQuickModal}
        title="Create Goal"
        description="Set a new learning objective"
      >
        <form onSubmit={handleQuickGoalSubmit} className="space-y-4">
          <Input label="Goal Title *" placeholder="e.g. Complete React Hooks chapter" value={goalForm.title} onChange={(e) => setGoalForm(prev => ({ ...prev, title: e.target.value }))} />
          <Select label="Subject" value={goalForm.subject} onChange={(e) => setGoalForm(prev => ({ ...prev, subject: e.target.value }))}>
            <option value="">Select subject...</option>
            {QUICK_SUBJECTS.map(subject => <option key={subject} value={subject}>{subject}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Deadline" value={goalForm.deadline} onChange={(e) => setGoalForm(prev => ({ ...prev, deadline: e.target.value }))} />
            <Select label="Priority" value={goalForm.priority} onChange={(e) => setGoalForm(prev => ({ ...prev, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </div>
          <Textarea label="Notes (optional)" rows={3} placeholder="Details about this goal..." value={goalForm.description} onChange={(e) => setGoalForm(prev => ({ ...prev, description: e.target.value }))} />
          {quickError && <p className="text-xs text-red-400">{quickError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeQuickModal}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={quickSaving}>Save goal</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={quickModal === 'resource'}
        onClose={closeQuickModal}
        title="Add Resource"
        description="Save a learning resource"
      >
        <form onSubmit={handleQuickResourceSubmit} className="space-y-4">
          <Input label="Title *" placeholder="e.g. React Hooks Deep Dive" value={resourceForm.title} onChange={(e) => setResourceForm(prev => ({ ...prev, title: e.target.value }))} />
          <Input type="url" label="URL *" value={resourceForm.url} onChange={(e) => setResourceForm(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..." />
          <Select label="Resource Type" value={resourceForm.category} onChange={(e) => setResourceForm(prev => ({ ...prev, category: e.target.value }))}>
            <option value="">Select resource type...</option>
            {QUICK_RESOURCE_CATEGORIES.map(category => <option key={category} value={category}>{category}</option>)}
          </Select>
          <Textarea label="Description" rows={3} placeholder="Why is this worth saving?" value={resourceForm.description} onChange={(e) => setResourceForm(prev => ({ ...prev, description: e.target.value }))} />
          {quickError && <p className="text-xs text-red-400">{quickError}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" className="flex-1" onClick={closeQuickModal}>Cancel</Button>
            <Button type="submit" className="flex-1" loading={quickSaving}>Save resource</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
