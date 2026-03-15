import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Sector,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line,
  ComposedChart, ReferenceLine
} from 'recharts'
import { useMemo, useRef, useState } from 'react'
import Card, { CardContent, CardHeader, CardTitle, CardDescription, StatCard } from '../../components/ui/Card'
import Modal from '../../components/ui/Modal'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useNotes } from '../../hooks/useNotes'
import { getSessionDuration } from '../../lib/utils'
import { BarChart3, TrendingUp, TrendingDown, Clock, Target, CalendarDays, Zap, Lightbulb, ArrowUpRight, ArrowDownRight, Minus, Flame, Trophy, BookOpen, AlertCircle } from 'lucide-react'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316', '#ec4899']
const RANGE_OPTIONS = [
  { value: 7, label: 'Last 7 days' },
  { value: 30, label: 'Last 30 days' },
  { value: 90, label: 'Last 3 months' },
]

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-slate-900/95 border border-slate-700/60 rounded-xl p-3 shadow-[0_20px_40px_rgba(0,0,0,0.5)] text-xs">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} className="font-bold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function StudyDayTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload ?? {}
  return (
    <div className="bg-slate-900/97 border border-slate-700/60 rounded-xl p-3 shadow-[0_20px_40px_rgba(0,0,0,0.55)] text-xs min-w-[160px]">
      <p className="text-slate-300 font-semibold mb-2">{d.fullDate}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="font-bold mb-0.5" style={{ color: p.color }}>
          {p.name}: {p.value}h
        </p>
      ))}
      {d.subjects?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <p className="text-slate-500 mb-1">Subjects:</p>
          {d.subjects.map((s) => (
            <p key={s} className="text-slate-300">· {s}</p>
          ))}
        </div>
      )}
      {d.sessionCount > 0 && (
        <p className="text-slate-500 mt-1">{d.sessionCount} session{d.sessionCount !== 1 ? 's' : ''}</p>
      )}
    </div>
  )
}

function ProductivityTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload ?? {}
  return (
    <div className="bg-slate-900/97 border border-slate-700/60 rounded-xl p-3 shadow-[0_20px_40px_rgba(0,0,0,0.55)] text-xs min-w-[185px]">
      <p className="text-slate-300 font-semibold mb-1">{d.fullDate}</p>
      <p className="text-2xl font-bold text-cyan-300 mb-2">
        {d.score}
        <span className="text-xs text-slate-500 font-normal ml-1">/ 100</span>
      </p>
      <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />Study Hours
          </span>
          <span className="text-slate-200 font-semibold">{d.hoursScore ?? 0}<span className="text-slate-600">/40</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />Consistency
          </span>
          <span className="text-slate-200 font-semibold">{d.consistencyScore ?? 0}<span className="text-slate-600">/30</span></span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />Goal Rate
          </span>
          <span className="text-slate-200 font-semibold">{d.goalScore ?? 0}<span className="text-slate-600">/30</span></span>
        </div>
      </div>
    </div>
  )
}

function FocusTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload ?? {}
  return (
    <div className="bg-slate-900/97 border border-slate-700/60 rounded-xl p-3 shadow-[0_20px_40px_rgba(0,0,0,0.55)] text-xs min-w-[170px]">
      <p className="text-slate-300 font-semibold mb-2">{d.fullDate}</p>
      {d.deep > 0 && (
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-cyan-400 inline-block" />
            <span className="text-slate-300">Deep Focus</span>
          </span>
          <span className="font-bold text-cyan-300">{d.deep}h</span>
        </div>
      )}
      {d.shallow > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-amber-400 inline-block" />
            <span className="text-slate-300">Shallow Work</span>
          </span>
          <span className="font-bold text-amber-300">{d.shallow}h</span>
        </div>
      )}
      {(d.deepSessions > 0 || d.shallowSessions > 0) && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 text-slate-500">
          {d.deepSessions > 0 && <p>{d.deepSessions} deep session{d.deepSessions !== 1 ? 's' : ''} (≥30 min)</p>}
          {d.shallowSessions > 0 && <p>{d.shallowSessions} shallow session{d.shallowSessions !== 1 ? 's' : ''} (&lt;30 min)</p>}
        </div>
      )}
      {d.deep === 0 && d.shallow === 0 && (
        <p className="text-slate-500">No sessions</p>
      )}
    </div>
  )
}

function SubjectTooltip({ tooltip }) {
  if (!tooltip) return null

  const { x, y, data, color } = tooltip
  return (
    <div
      className="pointer-events-none absolute z-20 w-[170px] max-w-[180px] text-xs"
      style={{
        left: x,
        top: y,
        background: '#0f172a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        padding: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
      }}
    >
      <p className="text-sm font-semibold text-slate-100 mb-2">{data.name}</p>
      <div className="space-y-1 text-xs">
        <p className="font-medium" style={{ color }}>Hours studied: {data.hours}h</p>
        <p className="text-slate-300">Percentage of total: {data.pct}%</p>
        <p className="text-slate-500">Sessions: {data.value}</p>
      </div>
    </div>
  )
}

function renderActiveSubjectShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
  } = props

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius + 6}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke="#e2e8f0"
      strokeWidth={1.25}
      style={{ filter: `brightness(1.08) drop-shadow(0 0 10px ${fill}50)` }}
    />
  )
}

function getDayKey(dateLike) {
  const date = new Date(dateLike)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function darkenHex(hex, amount = 0.28) {
  const normalized = hex.replace('#', '')
  const num = Number.parseInt(normalized, 16)
  const red = (num >> 16) & 255
  const green = (num >> 8) & 255
  const blue = num & 255
  const shade = (value) => Math.max(0, Math.round(value * (1 - amount)))
  return `#${[shade(red), shade(green), shade(blue)].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

function getRangeStart(now, days) {
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - (days - 1))
  return start
}

function formatHeatmapHours(hours) {
  if (hours === 0) return '0'
  if (hours < 1) return hours.toFixed(1)
  return Number(hours.toFixed(1)).toString()
}

function HeatCell({ level, title, compact = false, index = 0, onClick }) {
  const levelStyle = [
    { backgroundColor: '#1e293b', borderColor: '#334155' },
    { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
    { backgroundColor: '#3b82f6', borderColor: '#60a5fa' },
    { backgroundColor: '#60a5fa', borderColor: '#93c5fd' },
    { backgroundColor: '#93c5fd', borderColor: '#dbeafe' },
  ][level]

  return (
    <div
      className="relative group heatmap-cell"
      style={compact ? undefined : { animationDelay: `${Math.min(index * 4, 1500)}ms` }}
    >
      <button
        type="button"
        onClick={onClick}
        className={`${compact ? 'w-[12px] h-[12px] rounded-[2px]' : 'w-[12px] h-[12px] rounded-[2px] heatmap-cell-surface'} border block ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
        style={levelStyle}
        aria-label={title?.replaceAll('\n', '. ')}
      />
      {title && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-200 whitespace-pre pointer-events-none z-50 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg min-w-max">
          {title}
        </div>
      )}
    </div>
  )
}

function GoalTimelineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const weekly = payload.find((p) => p.dataKey === 'completed')?.value ?? 0
  const total = payload.find((p) => p.dataKey === 'cumulative')?.value ?? 0
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      <p className="text-emerald-400">+{weekly} goal{weekly !== 1 ? 's' : ''} this week</p>
      <p className="text-slate-300">{total} total completed</p>
    </div>
  )
}

function getTrendMeta(delta) {
  if (delta > 0) return { tone: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25', Icon: ArrowUpRight, label: 'up' }
  if (delta < 0) return { tone: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/25', Icon: ArrowDownRight, label: 'down' }
  return { tone: 'text-slate-400', bg: 'bg-slate-700/20 border-slate-700/35', Icon: Minus, label: 'flat' }
}

export default function Analytics() {
  const { sessions, loading: sessionsLoading } = useStudySessions()
  const { goals, loading: goalsLoading } = useGoals()
  const { notes } = useNotes()
  const [activeSubject, setActiveSubject] = useState(null)
  const [hoveredSubject, setHoveredSubject] = useState(null)
  const [selectedRange, setSelectedRange] = useState(30)
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState(null)
  const [subjectTooltip, setSubjectTooltip] = useState(null)
  const subjectChartRef = useRef(null)

  const analytics = useMemo(() => {
    const now = new Date()
    const rangeStart = getRangeStart(now, selectedRange)
    const rangeEnd = new Date(now)
    rangeEnd.setHours(23, 59, 59, 999)
    const heatmapStart = getRangeStart(now, 365)
    const weekBucketCount = Math.max(1, Math.ceil(selectedRange / 7))
    const xAxisInterval = selectedRange <= 7 ? 0 : selectedRange <= 30 ? 4 : 11
    const chartTitle = `${selectedRange === 90 ? '90-Day' : `${selectedRange}-Day`} Study Hours`
    const rangeLabel = RANGE_OPTIONS.find((option) => option.value === selectedRange)?.label ?? 'Last 30 days'
    const dayMinutesMap = {}
    const daySessionCountMap = {}
    const heatmapDayMinutesMap = {}
    const heatmapDaySessionCountMap = {}
    const heatmapDaySubjectsMap = {}
    const weekdayMinutes = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }
    const weekdayCount = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 }

    const sessionsInRange = sessions.filter((session) => {
      const date = new Date(session.created_at)
      return date >= rangeStart && date <= rangeEnd
    })

    const effectiveSessions = activeSubject
      ? sessionsInRange.filter((s) => (s.subject ?? 'Other') === activeSubject)
      : sessionsInRange

    const heatmapSessions = activeSubject
      ? sessions.filter((s) => (s.subject ?? 'Other') === activeSubject)
      : sessions

    let totalMinutes = 0
    effectiveSessions.forEach((session) => {
      const date = new Date(session.created_at)
      const key = getDayKey(date)
      const mins = getSessionDuration(session)

      totalMinutes += mins
      dayMinutesMap[key] = (dayMinutesMap[key] ?? 0) + mins
      daySessionCountMap[key] = (daySessionCountMap[key] ?? 0) + 1

      const weekLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
      weekdayMinutes[weekLabel] = (weekdayMinutes[weekLabel] ?? 0) + mins
      weekdayCount[weekLabel] = (weekdayCount[weekLabel] ?? 0) + 1
    })

    heatmapSessions.forEach((session) => {
      const date = new Date(session.created_at)
      if (date < heatmapStart || date > rangeEnd) return

      const key = getDayKey(date)
      const mins = getSessionDuration(session)
      heatmapDayMinutesMap[key] = (heatmapDayMinutesMap[key] ?? 0) + mins
      heatmapDaySessionCountMap[key] = (heatmapDaySessionCountMap[key] ?? 0) + 1
      if (!heatmapDaySubjectsMap[key]) heatmapDaySubjectsMap[key] = new Set()
      if (session.subject) heatmapDaySubjectsMap[key].add(session.subject)
    })

    // Build per-day subject lists for the tooltip
    const daySubjectsMap = {}
    effectiveSessions.forEach((session) => {
      const key = getDayKey(session.created_at)
      if (!daySubjectsMap[key]) daySubjectsMap[key] = new Set()
      if (session.subject) daySubjectsMap[key].add(session.subject)
    })

    const monthlyRaw = Array.from({ length: selectedRange }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - ((selectedRange - 1) - i))
      const key = getDayKey(d)
      const minutes = dayMinutesMap[key] ?? 0
      return {
        day: d.getDate().toString(),
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        hours: Number((minutes / 60).toFixed(2)),
        sessionCount: daySessionCountMap[key] ?? 0,
        subjects: Array.from(daySubjectsMap[key] ?? []),
      }
    })

    const studiedDays = monthlyRaw.filter((d) => d.hours > 0).length
    const isSparse = studiedDays < Math.max(3, Math.round(selectedRange * 0.25))

    let cumulative = 0
    const monthlyData = monthlyRaw.map((entry) => {
      cumulative = Number((cumulative + entry.hours).toFixed(2))
      return { ...entry, cumulative }
    })

    const consistencyScore = Math.round((studiedDays / selectedRange) * 100)

    const focusVsShallow = Array.from({ length: selectedRange }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - ((selectedRange - 1) - i))
      const key = getDayKey(d)
      const daySessions = effectiveSessions.filter((s) => getDayKey(s.created_at) === key)
      // Deep Focus: session duration >= 30 min; Shallow Work: session duration < 30 min
      const deepMinutes = daySessions
        .filter((s) => getSessionDuration(s) >= 30)
        .reduce((acc, s) => acc + getSessionDuration(s), 0)
      const shallowMinutes = daySessions
        .filter((s) => getSessionDuration(s) < 30)
        .reduce((acc, s) => acc + getSessionDuration(s), 0)

      return {
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        deep: Number((deepMinutes / 60).toFixed(2)),
        shallow: Number((shallowMinutes / 60).toFixed(2)),
        deepSessions: daySessions.filter((s) => getSessionDuration(s) >= 30).length,
        shallowSessions: daySessions.filter((s) => getSessionDuration(s) < 30).length,
      }
    })

    const completedGoalsInRange = goals.filter((g) => {
      const completedAt = new Date(g.completed_at || g.created_at)
      return (g.completed === true || Number(g.progress) >= 100) && completedAt >= rangeStart && completedAt <= rangeEnd
    }).length
    const totalGoalsInRange = goals.filter((g) => {
      const createdAt = new Date(g.created_at)
      return createdAt >= rangeStart && createdAt <= rangeEnd
    }).length
    const rangeGoalRate = totalGoalsInRange > 0 ? completedGoalsInRange / totalGoalsInRange : 0

    const productivityTrend = Array.from({ length: selectedRange }, (_, i) => {
      const d = new Date(now)
      d.setDate(d.getDate() - ((selectedRange - 1) - i))
      const key = getDayKey(d)

      // Pillar 1 – Study hours (40 pts): 2h/day = full score
      const dayMinutes = dayMinutesMap[key] ?? 0
      const hoursScore = Math.round(Math.min(dayMinutes / 120, 1) * 40)

      // Pillar 2 – 7-day rolling consistency (30 pts)
      let studyDaysIn7 = 0
      for (let j = 0; j < 7; j++) {
        const past = new Date(d)
        past.setDate(past.getDate() - j)
        if (dayMinutesMap[getDayKey(past)] > 0) studyDaysIn7++
      }
      const rollingConsistency = Math.round((studyDaysIn7 / 7) * 30)

      // Pillar 3 – Goal completion rate (30 pts)
      const totalGoalsCount = goals.length
      const completedGoalsCount = goals.filter(
        (g) => g.completed === true || Number(g.progress) >= 100
      ).length
      const overallGoalRate = totalGoalsCount > 0 ? completedGoalsCount / totalGoalsCount : 0
      const goalScore = Math.round((totalGoalsInRange > 0 ? rangeGoalRate : overallGoalRate) * 30)

      const score = hoursScore + rollingConsistency + goalScore

      return {
        day: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        score,
        hoursScore,
        consistencyScore: rollingConsistency,
        goalScore,
      }
    })

    // Week-over-week insight
    const previousRangeStart = getRangeStart(new Date(rangeStart.getTime() - 86400000), selectedRange)
    const previousRangeEnd = new Date(rangeStart)
    previousRangeEnd.setMilliseconds(previousRangeEnd.getMilliseconds() - 1)

    const getProductivityAverageForWindow = (start, end) => {
      const dayCount = Math.max(1, Math.round((end - start) / 86400000) + 1)
      let totalScore = 0

      for (let i = 0; i < dayCount; i++) {
        const day = new Date(start)
        day.setDate(day.getDate() + i)
        const key = getDayKey(day)
        const dayMinutes = sessions
          .filter((s) => {
            const date = new Date(s.created_at)
            return date >= start && date <= end && getDayKey(s.created_at) === key
          })
          .reduce((acc, s) => acc + getSessionDuration(s), 0)

        const hoursScore = Math.round(Math.min(dayMinutes / 120, 1) * 40)
        let studyDaysIn7 = 0
        for (let j = 0; j < 7; j++) {
          const past = new Date(day)
          past.setDate(past.getDate() - j)
          const hasStudy = sessions.some((s) => {
            const date = new Date(s.created_at)
            return date >= start && date <= end && getDayKey(s.created_at) === getDayKey(past)
          })
          if (hasStudy) studyDaysIn7++
        }

        const rollingConsistency = Math.round((studyDaysIn7 / 7) * 30)
        const goalsInWindow = goals.filter((g) => {
          const createdAt = new Date(g.created_at)
          return createdAt >= start && createdAt <= end
        })
        const completedInWindow = goalsInWindow.filter((g) => g.completed === true || Number(g.progress) >= 100).length
        const goalRate = goalsInWindow.length > 0 ? completedInWindow / goalsInWindow.length : 0
        totalScore += hoursScore + rollingConsistency + Math.round(goalRate * 30)
      }

      return totalScore / dayCount
    }

    const thisRangeAvgScore = productivityTrend.reduce((a, b) => a + b.score, 0) / Math.max(1, productivityTrend.length)
    const lastRangeAvgScore = getProductivityAverageForWindow(previousRangeStart, previousRangeEnd)
    const prodPctChange =
      lastRangeAvgScore > 0
        ? Math.round(((thisRangeAvgScore - lastRangeAvgScore) / lastRangeAvgScore) * 100)
        : thisRangeAvgScore > 0
          ? 100
          : 0
    const prodInsight =
      prodPctChange > 0
        ? `Your productivity increased by ${prodPctChange}% this week.`
        : prodPctChange < 0
          ? `Your productivity decreased by ${Math.abs(prodPctChange)}% this week.`
          : 'Your productivity is steady this week.'

    const weekdayAverages = Object.keys(weekdayMinutes).map((day) => ({
      day,
      avgMinutes: weekdayCount[day] ? weekdayMinutes[day] / weekdayCount[day] : 0,
      totalMinutes: weekdayMinutes[day],
    }))
    const bestDay = weekdayAverages.sort((a, b) => b.avgMinutes - a.avgMinutes)[0]?.day ?? 'N/A'

    const heatmapDays = Array.from({ length: 365 }, (_, i) => {
      const d = new Date(heatmapStart)
      d.setDate(heatmapStart.getDate() + i)
      const key = getDayKey(d)
      const minutes = heatmapDayMinutesMap[key] ?? 0
      const hours = minutes / 60
      const sessionCount = heatmapDaySessionCountMap[key] ?? 0
      const level = hours === 0 ? 0 : hours < 2 ? 1 : hours < 3 ? 2 : hours < 4 ? 3 : 4
      const label = `${d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\nStudied ${formatHeatmapHours(hours)} hour${hours === 1 ? '' : 's'}\n${sessionCount} session${sessionCount !== 1 ? 's' : ''}`

      return {
        key,
        level,
        label,
        date: new Date(d),
        sessionCount,
        hours,
        subjects: Array.from(heatmapDaySubjectsMap[key] ?? []),
      }
    })

    const firstWeekOffset = heatmapDays[0]?.date?.getDay?.() ?? 0
    const paddedHeatmapDays = [
      ...Array.from({ length: firstWeekOffset }, () => null),
      ...heatmapDays,
    ]

    while (paddedHeatmapDays.length % 7 !== 0) {
      paddedHeatmapDays.push(null)
    }

    const heatmapWeeks = Array.from(
      { length: Math.ceil(paddedHeatmapDays.length / 7) },
      (_, weekIndex) => paddedHeatmapDays.slice(weekIndex * 7, weekIndex * 7 + 7)
    )

    const heatmapWeekMeta = heatmapWeeks.map((week, weekIndex) => {
      const monthStartDay = week.find((day) => day && day.date.getDate() === 1)
      return {
        monthLabel: monthStartDay ? monthStartDay.date.toLocaleDateString('en-US', { month: 'short' }) : null,
        gapBefore: weekIndex > 0 && Boolean(monthStartDay),
      }
    })

    const activeHeatmapDays = heatmapDays.filter((day) => day.sessionCount > 0)
    const totalHeatmapSessions = heatmapDays.reduce((acc, day) => acc + day.sessionCount, 0)
    const totalActiveStudyDays = activeHeatmapDays.length
    let longestStudyStreak = 0
    let currentStudyStreak = 0
    let runningStreak = 0

    heatmapDays.forEach((day) => {
      if (day.sessionCount > 0) {
        runningStreak += 1
        if (runningStreak > longestStudyStreak) longestStudyStreak = runningStreak
      } else {
        runningStreak = 0
      }
    })

    for (let i = heatmapDays.length - 1; i >= 0; i--) {
      if (heatmapDays[i].sessionCount > 0) currentStudyStreak += 1
      else break
    }

    const subjectMap = {}
    const subjectMinutesMap = {}
    sessionsInRange.forEach((s) => {
      const subj = s.subject ?? 'Other'
      subjectMap[subj] = (subjectMap[subj] ?? 0) + 1
      subjectMinutesMap[subj] = (subjectMinutesMap[subj] ?? 0) + getSessionDuration(s)
    })
    const totalSubjectMinutes = Object.values(subjectMinutesMap).reduce((a, b) => a + b, 0)
    const subjectData = Object.entries(subjectMap)
      .map(([name, count]) => ({
        name,
        value: count,
        hours: Number(((subjectMinutesMap[name] ?? 0) / 60).toFixed(1)),
        pct: totalSubjectMinutes > 0
          ? Math.round(((subjectMinutesMap[name] ?? 0) / totalSubjectMinutes) * 100)
          : 0,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 8)
      const totalSubjectHours = Number((totalSubjectMinutes / 60).toFixed(1))

    const completedGoals = goals
      .filter((g) => g.completed === true || Number(g.progress) >= 100)
      .map((g) => new Date(g.completed_at || g.created_at))
      .filter((d) => !Number.isNaN(d.getTime()))

    const goalTimeline = Array.from({ length: weekBucketCount }, (_, i) => {
      const end = new Date(now)
      end.setDate(end.getDate() - ((weekBucketCount - 1 - i) * 7))
      const start = new Date(end)
      start.setDate(start.getDate() - 6)
      const weekCompleted = completedGoals.filter((d) => d >= start && d <= end).length
      const weekLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      return { week: weekLabel, completed: weekCompleted }
    })

    let running = 0
    const goalTimelineCumulative = goalTimeline.map((entry) => {
      running += entry.completed
      return { ...entry, cumulative: running }
    })

    const avgHoursPerDay = (totalMinutes / 60 / selectedRange).toFixed(1)

    return {
      rangeDays: selectedRange,
      rangeLabel,
      rangeTitle: chartTitle,
      xAxisInterval,
      totalMinutes,
      avgHoursPerDay,
      consistencyScore,
      monthlyData,
      isSparse,
      subjectData,
      totalSubjectHours,
      focusVsShallow,
      productivityTrend,
      prodInsight,
      bestDay,
      heatmapWeeks,
      heatmapWeekMeta,
      heatmapSummary: {
        totalSessions: totalHeatmapSessions,
        activeDays: totalActiveStudyDays,
        longestStreak: longestStudyStreak,
        currentStreak: currentStudyStreak,
      },
      goalTimelineCumulative,
    }
  }, [sessions, goals, activeSubject, selectedRange])

  const heatmapDayDetails = useMemo(() => {
    if (!selectedHeatmapDay) return null

    const dayKey = selectedHeatmapDay.key
    const daySessions = sessions
      .filter((session) => getDayKey(session.created_at) === dayKey)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

    const dayNotes = notes
      .filter((note) => getDayKey(note.created_at) === dayKey)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

    const subjects = Array.from(new Set(daySessions.map((session) => session.subject).filter(Boolean)))

    return {
      dateLabel: selectedHeatmapDay.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      sessions: daySessions,
      notes: dayNotes,
      subjects,
      sessionCount: daySessions.length,
      hours: Number(daySessions.reduce((acc, session) => acc + getSessionDuration(session), 0) / 60).toFixed(1),
    }
  }, [notes, selectedHeatmapDay, sessions])

  const activeSubjectName = activeSubject || hoveredSubject
  const activeSubjectIndex = activeSubjectName
    ? analytics.subjectData.findIndex((entry) => entry.name === activeSubjectName)
    : -1

  const updateSubjectTooltip = (entry, index, event) => {
    if (!subjectChartRef.current || index == null || index < 0) return

    const data = analytics.subjectData[index]
    if (!data) return

    const bounds = subjectChartRef.current.getBoundingClientRect()
    const viewportX = event?.pageX ?? event?.clientX ?? event?.nativeEvent?.pageX ?? event?.nativeEvent?.clientX
    const viewportY = event?.pageY ?? event?.clientY ?? event?.nativeEvent?.pageY ?? event?.nativeEvent?.clientY
    if (viewportX == null || viewportY == null) return

    const localX = 'pageX' in (event ?? {}) || 'pageY' in (event ?? {})
      ? viewportX - bounds.left - window.scrollX
      : viewportX - bounds.left
    const localY = 'pageX' in (event ?? {}) || 'pageY' in (event ?? {})
      ? viewportY - bounds.top - window.scrollY
      : viewportY - bounds.top

    const tooltipWidth = 170
    const tooltipHeight = 88
    const centerX = bounds.width / 2
    const placeRight = localX < centerX
    const x = clamp(placeRight ? localX + 18 : localX - tooltipWidth - 18, 8, bounds.width - tooltipWidth - 8)
    const y = clamp(localY - tooltipHeight / 2, 8, bounds.height - tooltipHeight - 8)

    setSubjectTooltip({
      x,
      y,
      data,
      color: COLORS[index % COLORS.length],
    })
  }

  const clearSubjectHover = () => {
    setHoveredSubject(null)
    setSubjectTooltip(null)
  }

  const insightsLoading = sessionsLoading && sessions.length === 0

  const insights = useMemo(() => {
    if (insightsLoading) return []

    const now = new Date()
    const rangeStart = getRangeStart(now, selectedRange)
    const rangeEnd = new Date(now)
    rangeEnd.setHours(23, 59, 59, 999)
    const items = []
    const rangeSessions = sessions.filter((session) => {
      const date = new Date(session.created_at)
      return date >= rangeStart && date <= rangeEnd
    })

    // 1. Current study streak
    let streak = 0
    for (let i = 0; i < selectedRange; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = getDayKey(d)
      if (rangeSessions.some((s) => getDayKey(s.created_at) === key)) streak++
      else break
    }
    if (streak >= 2) {
      items.push({ id: 'streak', Icon: Flame, color: 'orange', category: 'Streak', text: `You're on a ${streak}-day study streak. Keep it going!` })
    } else if (streak === 0 && rangeSessions.length > 0) {
      const sorted = [...rangeSessions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      const daysSince = Math.max(1, Math.floor((now - new Date(sorted[0].created_at)) / 86400000))
      items.push({ id: 'skip', Icon: AlertCircle, color: 'rose', category: 'Attendance', text: `You haven't studied in ${daysSince} day${daysSince !== 1 ? 's' : ''}. Time to get back on track!` })
    }

    // 2. Days skipped in the selected period
    const studiedKeys = new Set(rangeSessions.map((s) => getDayKey(s.created_at)))
    const skippedDays = selectedRange - studiedKeys.size
    if (streak < 2 && skippedDays >= Math.max(2, Math.round(selectedRange * 0.25)) && skippedDays < selectedRange) {
      items.push({ id: 'skipped-period', Icon: AlertCircle, color: 'amber', category: 'Attendance', text: `You skipped studying for ${skippedDays} days in ${analytics.rangeLabel.toLowerCase()}.` })
    }

    // 3. Range-over-range hours change
    const previousRangeEnd = new Date(rangeStart)
    previousRangeEnd.setMilliseconds(previousRangeEnd.getMilliseconds() - 1)
    const previousRangeStart = getRangeStart(new Date(previousRangeEnd), selectedRange)
    const currentRangeMinutes = rangeSessions.reduce((acc, s) => acc + getSessionDuration(s), 0)
    const previousRangeMinutes = sessions
      .filter((s) => {
        const date = new Date(s.created_at)
        return date >= previousRangeStart && date <= previousRangeEnd
      })
      .reduce((acc, s) => acc + getSessionDuration(s), 0)
    if (previousRangeMinutes > 0) {
      const pct = Math.round(((currentRangeMinutes - previousRangeMinutes) / previousRangeMinutes) * 100)
      if (pct >= 5) items.push({ id: 'range-up', Icon: TrendingUp, color: 'emerald', category: 'Progress', text: `You studied ${pct}% more in ${analytics.rangeLabel.toLowerCase()} than the previous period.` })
      else if (pct <= -5) items.push({ id: 'range-down', Icon: TrendingDown, color: 'rose', category: 'Progress', text: `You studied ${Math.abs(pct)}% less in ${analytics.rangeLabel.toLowerCase()} than the previous period.` })
    } else if (currentRangeMinutes > 0) {
      items.push({ id: 'range-start', Icon: TrendingUp, color: 'emerald', category: 'Progress', text: `Nice start — you've logged ${(currentRangeMinutes / 60).toFixed(1)}h in ${analytics.rangeLabel.toLowerCase()}.` })
    }

    // 4. Best study day
    if (analytics.bestDay && analytics.bestDay !== 'N/A') {
      items.push({ id: 'best-day', Icon: CalendarDays, color: 'indigo', category: 'Peak Productivity', text: `You are most productive on ${analytics.bestDay}s.` })
    }

    // 5. Top subject
    if (analytics.subjectData?.[0]) {
      const top = analytics.subjectData[0]
      items.push({ id: 'top-subject', Icon: BookOpen, color: 'purple', category: 'Top Subject', text: `Your most studied subject is ${top.name} with ${top.hours}h logged.` })
    }

    // 6. Goals completed this week
    const goalsInRange = goals
      .filter((g) => g.completed === true || Number(g.progress) >= 100)
      .filter((g) => {
        const completedAt = new Date(g.completed_at || g.created_at)
        return completedAt >= rangeStart && completedAt <= rangeEnd
      }).length
    if (!goalsLoading && goalsInRange > 0) {
      items.push({ id: 'goals-range', Icon: Trophy, color: 'amber', category: 'Goals', text: `You completed ${goalsInRange} goal${goalsInRange !== 1 ? 's' : ''} in ${analytics.rangeLabel.toLowerCase()}!` })
    }

    // 7. Consistency in selected period
    const consistencyPct = Math.round((studiedKeys.size / selectedRange) * 100)
    items.push({ id: 'consistency', Icon: CalendarDays, color: 'cyan', category: 'Consistency', text: `You've studied ${studiedKeys.size} out of ${selectedRange} days in ${analytics.rangeLabel.toLowerCase()} (${consistencyPct}%).` })

    // 8. Longest session
    if (rangeSessions.length > 0) {
      const longest = Math.max(...rangeSessions.map((s) => getSessionDuration(s)))
      if (longest > 0) {
        const h = Math.floor(longest / 60), m = Math.round(longest % 60)
        const label = h > 0 ? `${h}h ${m}m` : `${m}m`
        items.push({ id: 'longest', Icon: Zap, color: 'yellow', category: 'Best Session', text: `Your longest study session in ${analytics.rangeLabel.toLowerCase()} was ${label}.` })
      }
    }

    return items
  }, [sessions, goals, analytics, selectedRange, insightsLoading])

  const statCards = useMemo(() => {
    const now = new Date()
    const currentStart = getRangeStart(now, selectedRange)
    const currentEnd = new Date(now)
    currentEnd.setHours(23, 59, 59, 999)
    const previousEnd = new Date(currentStart)
    previousEnd.setMilliseconds(previousEnd.getMilliseconds() - 1)
    const previousStart = getRangeStart(new Date(previousEnd), selectedRange)

    const minutesInWindow = (start, end) => {
      return sessions
        .filter((s) => {
          const d = new Date(s.created_at)
          return d >= start && d <= end
        })
        .reduce((acc, s) => acc + getSessionDuration(s), 0)
    }

    const countSessionsInWindow = (start, end) => {
      return sessions.filter((s) => {
        const d = new Date(s.created_at)
        return d >= start && d <= end
      }).length
    }

    const thisWeekMinutes = minutesInWindow(currentStart, currentEnd)
    const lastWeekMinutes = minutesInWindow(previousStart, previousEnd)
    const thisWeekSessions = countSessionsInWindow(currentStart, currentEnd)
    const lastWeekSessions = countSessionsInWindow(previousStart, previousEnd)

    const thisWeekAvg = thisWeekMinutes / 60 / selectedRange
    const lastWeekAvg = lastWeekMinutes / 60 / selectedRange

    const completionRateInWindow = (start, end) => {
      const periodGoals = goals.filter((g) => {
        const created = new Date(g.created_at)
        return created >= start && created <= end
      })

      if (!periodGoals.length) return 0
      const done = periodGoals.filter((g) => g.completed === true || Number(g.progress) >= 100).length
      return Math.round((done / periodGoals.length) * 100)
    }

    const currentGoalRate = completionRateInWindow(currentStart, currentEnd)
    const prevGoalRate = completionRateInWindow(previousStart, previousEnd)

    return [
      {
        icon: Clock,
        label: 'Total Study',
        value: `${(analytics.totalMinutes / 60).toFixed(0)}h`,
        color: 'indigo',
        delta: Number(((thisWeekMinutes - lastWeekMinutes) / 60).toFixed(1)),
        deltaLabel: 'vs previous period',
        formatDelta: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}h`,
      },
      {
        icon: BarChart3,
        label: 'Sessions',
        value: thisWeekSessions,
        color: 'purple',
        delta: thisWeekSessions - lastWeekSessions,
        deltaLabel: 'vs previous period',
        formatDelta: (v) => `${v > 0 ? '+' : ''}${v}`,
      },
      {
        icon: TrendingUp,
        label: 'Avg Daily',
        value: `${analytics.avgHoursPerDay}h`,
        color: 'cyan',
        delta: Number((thisWeekAvg - lastWeekAvg).toFixed(1)),
        deltaLabel: 'vs previous period',
        formatDelta: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}h`,
      },
      {
        icon: Target,
        label: 'Goal Rate',
        value: `${currentGoalRate}%`,
        color: 'emerald',
        delta: currentGoalRate - prevGoalRate,
        deltaLabel: 'vs previous period',
        formatDelta: (v) => `${v > 0 ? '+' : ''}${v}%`,
      },
    ]
  }, [analytics.avgHoursPerDay, analytics.totalMinutes, goals, selectedRange, sessions])

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Insights into your learning patterns and progress</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => {
            const active = selectedRange === option.value
            return (
              <button
                key={option.value}
                onClick={() => setSelectedRange(option.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  active
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    : 'bg-slate-800/50 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, delta, deltaLabel, formatDelta }) => {
          const trend = getTrendMeta(delta)
          const TrendIcon = trend.Icon
          return (
            <StatCard
              key={label}
              icon={<Icon size={18} />}
              label={label}
              value={value}
              color={color}
              footer={(
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${trend.tone} ${trend.bg}`}>
                    <TrendIcon size={12} />
                    {formatDelta(delta)}
                  </span>
                  <span className="text-[11px] text-slate-500">{deltaLabel}</span>
                </div>
              )}
            />
          )
        })}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <section className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_38%),rgba(2,6,23,0.72)] px-5 py-5 md:px-6 md:py-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={16} className="text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-200">Insights</h2>
            <span className="text-xs text-slate-500">Live patterns from {analytics.rangeLabel.toLowerCase()}</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/70 bg-slate-900/45 px-3 py-1 text-[11px] text-slate-400 mb-3">
                {(() => {
                  const featured = insights[0]
                  const FeaturedIcon = featured.Icon
                  return <FeaturedIcon size={13} className={`text-${featured.color}-400`} />
                })()}
                <span>{insights[0].category}</span>
              </div>
              <p className="max-w-2xl text-2xl md:text-[1.85rem] leading-tight font-semibold tracking-tight text-slate-100">
                {insights[0].text}
              </p>
              {insights[1] && (
                <p className="mt-3 text-sm leading-6 text-slate-400 max-w-xl">
                  {insights[1].text}
                </p>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {insights.slice(1).map(({ id, Icon, color, category, text }) => (
                <div key={id} className="flex items-start gap-3 border-t border-slate-800/80 pt-3 first:border-t-0 first:pt-0 sm:first:border-t sm:first:pt-3 lg:first:border-t-0 lg:first:pt-0">
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-${color}-500/12`}>
                    <Icon size={14} className={`text-${color}-400`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">{category}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Actionable insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-cyan-400" />
              <CardTitle>Study Consistency</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{analytics.consistencyScore}%</p>
            <p className="text-xs text-slate-500 mt-1">Days studied in {analytics.rangeLabel.toLowerCase()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-indigo-400" />
              <CardTitle>Best Study Day</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-slate-100">You are most productive on {analytics.bestDay}s.</p>
            <p className="text-xs text-slate-500 mt-2">Based on average study minutes per weekday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-400" />
              <CardTitle>Productivity Trend</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-100">{analytics.productivityTrend[analytics.productivityTrend.length - 1]?.score ?? 0}</p>
            <p className="text-xs text-slate-500 mt-1">Latest productivity score out of 100</p>
            {analytics.prodInsight && (
              <p className={`text-xs mt-2 font-medium ${
                analytics.prodInsight.includes('increased') ? 'text-emerald-400'
                : analytics.prodInsight.includes('decreased') ? 'text-rose-400'
                : 'text-slate-500'
              }`}>{analytics.prodInsight}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Study hours chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>{analytics.rangeTitle}</CardTitle>
            <div className="flex items-center gap-2">
              {activeSubject && (
                <button
                  onClick={() => setActiveSubject(null)}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 rounded-md px-2 py-0.5 hover:bg-indigo-500/25 transition-colors"
                >
                  {activeSubject} &times;
                </button>
              )}
              {analytics.isSparse && (
                <span className="text-[11px] text-slate-400 bg-slate-700/20 border border-slate-700/40 rounded-md px-2 py-0.5">
                  Cumulative (sparse)
                </span>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="studyGrad30" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="studyGrad30Cum" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={analytics.xAxisInterval} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<StudyDayTooltip />} />
                {analytics.isSparse ? (
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    name="Cumulative Hours"
                    stroke="#22d3ee"
                    strokeWidth={2.5}
                    fill="url(#studyGrad30Cum)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#67e8f9', strokeWidth: 0 }}
                    isAnimationActive={true}
                    animationDuration={1400}
                    animationEasing="ease-out"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="hours"
                    name="Hours"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fill="url(#studyGrad30)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#818cf8', strokeWidth: 0 }}
                    isAnimationActive={true}
                    animationDuration={1400}
                    animationEasing="ease-out"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject distribution */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subject Distribution</CardTitle>
            {activeSubject && (
              <button
                onClick={() => setActiveSubject(null)}
                className="text-[11px] text-slate-400 hover:text-slate-200 bg-slate-700/25 border border-slate-700/50 rounded-md px-2 py-0.5 transition-colors"
              >
                Clear filter &times;
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {analytics.subjectData.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-slate-600">No sessions yet</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-5 items-center">
                <div
                  ref={subjectChartRef}
                  className="relative h-72 w-full md:w-72 shrink-0 rounded-2xl border border-slate-800/70 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_45%),rgba(15,23,42,0.55)] p-2"
                  onMouseLeave={clearSubjectHover}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.subjectData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={2.2}
                        dataKey="value"
                        activeIndex={activeSubjectIndex >= 0 ? activeSubjectIndex : undefined}
                        activeShape={renderActiveSubjectShape}
                        animationBegin={80}
                        animationDuration={700}
                        isAnimationActive
                        onClick={(data) => setActiveSubject((prev) => prev === data.name ? null : data.name)}
                        onMouseEnter={(entry, index, event) => {
                          setHoveredSubject(analytics.subjectData[index]?.name ?? null)
                          updateSubjectTooltip(entry, index, event)
                        }}
                        onMouseMove={updateSubjectTooltip}
                        onMouseLeave={clearSubjectHover}
                        style={{ cursor: 'pointer' }}
                      >
                        {analytics.subjectData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            opacity={!activeSubject && !hoveredSubject ? 1 : (activeSubject || hoveredSubject) === entry.name ? 1 : 0.24}
                            stroke={(activeSubject || hoveredSubject) === entry.name ? '#e2e8f0' : darkenHex(COLORS[i % COLORS.length], 0.1)}
                            strokeWidth={(activeSubject || hoveredSubject) === entry.name ? 1.25 : 0.8}
                            style={{ filter: (activeSubject || hoveredSubject) === entry.name ? `brightness(1.08)` : 'none', transition: 'filter 200ms ease' }}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Total Study</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-100">{analytics.totalSubjectHours}h</p>
                    </div>
                  </div>
                  <SubjectTooltip tooltip={subjectTooltip} />
                </div>
                <div className="flex-1 space-y-2 min-w-0 w-full">
                  {analytics.subjectData.map((entry, i) => (
                    <button
                      key={entry.name}
                      onClick={() => setActiveSubject((prev) => prev === entry.name ? null : entry.name)}
                      onMouseEnter={() => setHoveredSubject(entry.name)}
                      onMouseLeave={clearSubjectHover}
                      className={`w-full grid grid-cols-[auto,minmax(0,1fr),auto,auto] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all duration-150 ${
                        activeSubject === entry.name
                          ? 'bg-slate-700/70 border-slate-500/60 shadow-[0_10px_30px_rgba(15,23,42,0.35)]'
                          : hoveredSubject === entry.name
                            ? 'bg-slate-800/90 border-slate-700/90'
                            : 'bg-slate-900/55 border-slate-800/80 hover:bg-slate-800/75'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="flex-1 text-xs text-slate-200 truncate">{entry.name}</span>
                      <span className="text-xs font-semibold text-slate-100 text-right tabular-nums whitespace-nowrap">{entry.hours}h</span>
                      <span className="text-[11px] text-slate-500 text-right tabular-nums whitespace-nowrap">({entry.pct}%)</span>
                    </button>
                  ))}
                </div>
              </div>

              {analytics.subjectData[0] && (
                <div className="mt-5 rounded-2xl border border-slate-800/70 bg-[linear-gradient(135deg,rgba(37,99,235,0.12),rgba(15,23,42,0.75))] px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Most Studied Subject</p>
                  <p className="mt-2 text-xl font-semibold text-slate-100">{analytics.subjectData[0].name}</p>
                  <p className="mt-1 text-sm text-slate-300">{analytics.subjectData[0].pct}% of total study time.</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Focus vs shallow */}
      <Card>
        <CardHeader>
          <CardTitle>Focus Hours vs Shallow Hours</CardTitle>
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-sm bg-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-cyan-300">Deep Focus</p>
                <p className="text-[11px] text-slate-500">Sessions ≥ 30 minutes</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-sm bg-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-300">Shallow Work</p>
                <p className="text-[11px] text-slate-500">Sessions &lt; 30 minutes</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.focusVsShallow} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={analytics.xAxisInterval} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<FocusTooltip />} />
                <Bar dataKey="deep" name="Deep Focus" stackId="a" fill="#06b6d4" radius={[0, 0, 0, 0]} isAnimationActive={true} animationDuration={1200} />
                <Bar dataKey="shallow" name="Shallow Work" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} isAnimationActive={true} animationDuration={1200} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Productivity trend */}
      <Card>
        <CardHeader>
          <CardTitle>Productivity Trend</CardTitle>
          {analytics.prodInsight && (
            <p className={`text-sm font-medium mt-1 ${
              analytics.prodInsight.includes('increased') ? 'text-emerald-400'
              : analytics.prodInsight.includes('decreased') ? 'text-rose-400'
              : 'text-slate-400'
            }`}>
              {analytics.prodInsight}
            </p>
          )}
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300">Study Hours</p>
                <p className="text-[11px] text-slate-500">40% · target 2h/day</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300">Consistency</p>
                <p className="text-[11px] text-slate-500">30% · 7-day rolling</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-300">Goal Completion</p>
                <p className="text-[11px] text-slate-500">30% · overall rate</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.productivityTrend} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="prodGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="day" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} interval={analytics.xAxisInterval} />
                <YAxis domain={[0, 100]} tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ProductivityTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Productivity"
                  stroke="#22d3ee"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#67e8f9', strokeWidth: 0 }}
                  isAnimationActive={true}
                  animationDuration={1400}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Study heatmap */}
      <Card>
        <CardHeader><CardTitle>Study Heatmap</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Study Sessions</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{analytics.heatmapSummary.totalSessions}</p>
              <p className="text-xs text-slate-500 mt-1">in the last 365 days</p>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Active Study Days</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{analytics.heatmapSummary.activeDays}</p>
              <p className="text-xs text-slate-500 mt-1">days with at least one session</p>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Longest Streak</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{analytics.heatmapSummary.longestStreak}</p>
              <p className="text-xs text-slate-500 mt-1">consecutive study days</p>
            </div>
            <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Current Streak</p>
              <p className="mt-2 text-2xl font-semibold text-slate-100">{analytics.heatmapSummary.currentStreak}</p>
              <p className="text-xs text-slate-500 mt-1">days up to today</p>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <div className="min-w-[860px] w-max">
              <div className="flex gap-3">
                <div className="w-8 pt-5">
                  <div className="grid grid-rows-7 gap-y-1 text-[11px] text-slate-500">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="h-[12px] flex items-center">{day}</div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-end text-[11px] text-slate-500">
                    {analytics.heatmapWeekMeta.map((weekMeta, weekIndex) => (
                      <div
                        key={`month-label-${weekIndex}`}
                        className="w-[12px] flex-none justify-start whitespace-nowrap"
                        style={{ marginLeft: weekMeta.gapBefore ? '8px' : weekIndex === 0 ? '0px' : '3px' }}
                      >
                        {weekMeta.monthLabel}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start">
                    {analytics.heatmapWeeks.map((week, weekIndex) => (
                      <div
                        key={`week-${weekIndex}`}
                        className="grid grid-rows-7 gap-y-1 flex-none"
                        style={{ marginLeft: analytics.heatmapWeekMeta[weekIndex]?.gapBefore ? '8px' : weekIndex === 0 ? '0px' : '3px' }}
                      >
                        {week.map((day, dayIndex) => (
                          day ? (
                            <HeatCell
                              key={day.key}
                              level={day.level}
                              title={day.label}
                              index={weekIndex * 7 + dayIndex}
                              onClick={() => setSelectedHeatmapDay(day)}
                            />
                          ) : (
                            <div key={`empty-${weekIndex}-${dayIndex}`} className="w-[12px] h-[12px] rounded-[2px] opacity-0" />
                          )
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-slate-500">Last 365 days · hover a cell for details</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <HeatCell key={`legend-${level}`} level={level} title="" compact />
              ))}
              <span>More</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(selectedHeatmapDay && heatmapDayDetails)}
        onClose={() => setSelectedHeatmapDay(null)}
        title={heatmapDayDetails?.dateLabel}
        description={heatmapDayDetails ? `${heatmapDayDetails.sessionCount} session${heatmapDayDetails.sessionCount !== 1 ? 's' : ''} · ${heatmapDayDetails.hours}h studied` : ''}
        size="lg"
      >
        {heatmapDayDetails && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Sessions Logged</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{heatmapDayDetails.sessionCount}</p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Subjects Studied</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{heatmapDayDetails.subjects.length}</p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Notes Written</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{heatmapDayDetails.notes.length}</p>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Subjects Studied</h3>
                {heatmapDayDetails.subjects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {heatmapDayDetails.subjects.map((subject) => (
                      <span key={subject} className="inline-flex rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-200">
                        {subject}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No subjects recorded for this day.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-200 mb-3">Sessions Logged</h3>
                {heatmapDayDetails.sessions.length > 0 ? (
                  <div className="space-y-2">
                    {heatmapDayDetails.sessions.map((session) => (
                      <div key={session.id} className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-slate-200 truncate">{session.topic || session.subject || 'Study session'}</p>
                          <span className="text-xs text-slate-500 shrink-0">{Number(getSessionDuration(session) / 60).toFixed(1)}h</span>
                        </div>
                        {session.subject && <p className="text-xs text-slate-500 mt-1">{session.subject}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No sessions logged for this day.</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Notes Written</h3>
              {heatmapDayDetails.notes.length > 0 ? (
                <div className="space-y-2">
                  {heatmapDayDetails.notes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3">
                      <p className="text-sm font-medium text-slate-200">{note.title}</p>
                      {note.content && <p className="text-sm text-slate-400 mt-1 line-clamp-3">{note.content}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No notes written on this day.</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Goal completion timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Goal Completion Timeline</CardTitle>
          <CardDescription>Weekly completions (bars) &amp; cumulative total (line) across {analytics.rangeLabel.toLowerCase()} · milestones at 5, 10, 20</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={analytics.goalTimelineCumulative} margin={{ top: 10, right: 36, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis dataKey="week" tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<GoalTimelineTooltip />} />
                {[5, 10, 20].map((milestone) => (
                  <ReferenceLine
                    key={milestone}
                    y={milestone}
                    stroke="#f59e0b"
                    strokeDasharray="4 3"
                    strokeOpacity={0.65}
                    label={{ value: `★ ${milestone}`, position: 'right', fill: '#f59e0b', fontSize: 10, fontWeight: 600 }}
                  />
                ))}
                <Bar dataKey="completed" name="This week" fill="#34d399" opacity={0.75} radius={[3, 3, 0, 0]} barSize={12} />
                <Area type="monotone" dataKey="cumulative" name="Total" stroke="#10b981" strokeWidth={2} fill="url(#goalGrad)" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
