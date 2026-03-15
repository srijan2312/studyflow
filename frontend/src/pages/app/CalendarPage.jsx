import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from 'lucide-react'
import Card, { CardContent } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import {
  clamp,
  formatDate,
  formatDuration,
  formatTime,
  getSessionDuration,
  getSubjectColor,
} from '../../lib/utils'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function normalizeDate(dateLike) {
  if (dateLike instanceof Date) {
    return new Date(dateLike)
  }

  if (typeof dateLike === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateLike)) {
    const [year, month, day] = dateLike.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return new Date(dateLike)
}

function toDayKey(dateLike) {
  const date = normalizeDate(dateLike)
  date.setHours(0, 0, 0, 0)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isGoalCompleted(goal) {
  return goal.completed === true || goal.status === 'completed' || Number(goal.progress ?? 0) >= 100
}

function getGoalDeadline(goal) {
  return goal.deadline || goal.target_date || null
}

function moveSessionPayload(session, targetDate) {
  const sourceDate = new Date(session.start_time || session.created_at)
  const duration = getSessionDuration(session)

  const nextStart = new Date(targetDate)
  nextStart.setHours(sourceDate.getHours(), sourceDate.getMinutes(), 0, 0)

  const payload = {
    topic: session.topic,
    subject: session.subject,
    start_time: nextStart.toISOString(),
    created_at: nextStart.toISOString(),
    difficulty: session.difficulty,
    notes: session.notes,
    duration,
  }

  if (duration > 0) {
    const nextEnd = new Date(nextStart.getTime() + duration * 60000)
    payload.end_time = nextEnd.toISOString()
  }

  return payload
}

export default function CalendarPage() {
  const { sessions, updateSession } = useStudySessions()
  const { goals } = useGoals()

  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selectedDayKey, setSelectedDayKey] = useState(null)
  const [hoveredDay, setHoveredDay] = useState(null)
  const [dragSessionId, setDragSessionId] = useState(null)
  const [dropTargetKey, setDropTargetKey] = useState(null)
  const [feedback, setFeedback] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = useMemo(() => {
    const value = new Date()
    value.setHours(0, 0, 0, 0)
    return value
  }, [])

  const calendarData = useMemo(() => {
    const sessionMap = {}
    const completedGoalMap = {}
    const deadlineGoalMap = {}

    sessions.forEach((session) => {
      const key = toDayKey(session.created_at)
      if (!sessionMap[key]) sessionMap[key] = []
      sessionMap[key].push(session)
    })

    goals.forEach((goal) => {
      if (isGoalCompleted(goal)) {
        const completedAt = goal.completed_at || goal.updated_at || goal.created_at
        if (completedAt) {
          const key = toDayKey(completedAt)
          if (!completedGoalMap[key]) completedGoalMap[key] = []
          completedGoalMap[key].push(goal)
        }
      }

      const deadline = getGoalDeadline(goal)
      if (deadline) {
        const key = toDayKey(deadline)
        if (!deadlineGoalMap[key]) deadlineGoalMap[key] = []
        deadlineGoalMap[key].push(goal)
      }
    })

    const getDayData = (dateLike) => {
      const date = normalizeDate(dateLike)
      date.setHours(0, 0, 0, 0)
      const key = toDayKey(date)
      const daySessions = sessionMap[key] ?? []
      const completedGoals = completedGoalMap[key] ?? []
      const deadlineGoals = deadlineGoalMap[key] ?? []
      const missedGoals = deadlineGoals.filter((goal) => !isGoalCompleted(goal) && date < today)
      const minutes = daySessions.reduce((acc, session) => acc + getSessionDuration(session), 0)
      const subjects = Array.from(new Set(daySessions.map((session) => session.subject).filter(Boolean)))

      return {
        key,
        date,
        daySessions,
        completedGoals,
        deadlineGoals,
        missedGoals,
        minutes,
        hours: Number((minutes / 60).toFixed(1)),
        subjects,
      }
    }

    return { getDayData }
  }, [goals, sessions, today])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const calendarCells = useMemo(() => {
    const cells = []

    for (let i = firstDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthDays - i)
      cells.push({ date, isCurrentMonth: false, data: calendarData.getDayData(date) })
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      cells.push({ date, isCurrentMonth: true, data: calendarData.getDayData(date) })
    }

    const remaining = 42 - cells.length
    for (let day = 1; day <= remaining; day++) {
      const date = new Date(year, month + 1, day)
      cells.push({ date, isCurrentMonth: false, data: calendarData.getDayData(date) })
    }

    return cells
  }, [calendarData, daysInMonth, firstDay, month, prevMonthDays, year])

  const maxDayMinutes = useMemo(() => {
    return calendarCells
      .filter((cell) => cell.isCurrentMonth)
      .reduce((max, cell) => Math.max(max, cell.data.minutes), 0)
  }, [calendarCells])

  const selectedDayData = selectedDayKey ? calendarData.getDayData(selectedDayKey) : null

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const handleHover = (data, event) => {
    const tooltipWidth = 200
    const tooltipHeight = 126
    setHoveredDay({
      data,
      x: clamp(event.clientX + 16, 12, window.innerWidth - tooltipWidth - 12),
      y: clamp(event.clientY + 16, 12, window.innerHeight - tooltipHeight - 12),
    })
  }

  const handleDropOnDate = async (targetDate) => {
    if (!dragSessionId) return
    const session = sessions.find((item) => item.id === dragSessionId)
    if (!session) return

    const result = await updateSession(session.id, moveSessionPayload(session, targetDate))
    if (result?.error) {
      setFeedback({ type: 'error', text: result.error.message || 'Unable to move that session.' })
    } else {
      setFeedback({ type: 'success', text: `Moved "${session.topic}" to ${formatDate(targetDate, { month: 'short', day: 'numeric' })}.` })
    }

    setDragSessionId(null)
    setDropTargetKey(null)
  }

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Track study sessions, goals, and plan your week interactively.</p>
        </div>
      </div>

      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' : 'border-rose-500/30 bg-rose-500/10 text-rose-100'}`}>
          {feedback.text}
        </div>
      )}

      <Card className="border-slate-800/90 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.08),transparent_35%),rgba(2,6,23,0.72)]">
        <CardContent className="p-4 md:p-5">
          <div className="grid grid-cols-[auto,1fr,auto] items-center mb-2">
            <button
              onClick={prevMonth}
              className="h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-slate-300 hover:bg-white/[0.12] hover:scale-[1.05] hover:shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <h2 className="text-center text-xl md:text-2xl font-extrabold tracking-tight text-slate-100">
              {MONTHS[month]} {year}
            </h2>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="h-8 px-4 rounded-full border border-cyan-400/35 bg-cyan-500/10 text-xs font-semibold tracking-wide text-cyan-200 hover:bg-cyan-500/20 hover:shadow-[0_8px_18px_rgba(34,211,238,0.2)] transition-all"
              >
                Today
              </button>
              <button
                onClick={nextMonth}
                className="h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-slate-300 hover:bg-white/[0.12] hover:scale-[1.05] hover:shadow-[0_10px_24px_rgba(15,23,42,0.35)] transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mb-4 text-[11px] text-slate-500">
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" />Study session</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Completed goal</div>
            <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" />Missed goal</div>
          </div>

              <div className="grid grid-cols-7 mb-2">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-[11px] uppercase tracking-[0.12em] font-semibold text-slate-600 py-1">{day}</div>
                ))}
              </div>

              <div className="max-w-[1060px] mx-auto grid grid-cols-7 gap-2.5">
                {calendarCells.map((cell, idx) => {
                  const isToday = toDayKey(cell.date) === toDayKey(today)
                  const selected = selectedDayKey === cell.data.key
                  const hasStudy = cell.data.daySessions.length > 0
                  const hasCompletedGoal = cell.data.completedGoals.length > 0
                  const hasMissedGoal = cell.data.missedGoals.length > 0
                  const sessionDotCount = Math.min(4, cell.data.daySessions.length)
                  const hourStrength = maxDayMinutes > 0 ? cell.data.minutes / maxDayMinutes : 0
                  const sessionStrength = Math.min(cell.data.daySessions.length / 6, 1)
                  const intensity = Math.max(hourStrength * 0.85, sessionStrength)
                  const activeBgTop = `rgba(56,189,248,${0.1 + intensity * 0.22})`
                  const activeBgBottom = `rgba(14,116,144,${0.07 + intensity * 0.2})`
                  const activeBorder = `rgba(56,189,248,${0.14 + intensity * 0.2})`

                  return (
                    <button
                      key={idx}
                      type="button"
                      onDragOver={(event) => {
                        if (!cell.isCurrentMonth) return
                        event.preventDefault()
                        setDropTargetKey(cell.data.key)
                      }}
                      onDragLeave={() => setDropTargetKey((prev) => prev === cell.data.key ? null : prev)}
                      onDrop={async (event) => {
                        event.preventDefault()
                        await handleDropOnDate(cell.date)
                      }}
                      onMouseEnter={(event) => cell.isCurrentMonth && handleHover(cell.data, event)}
                      onMouseMove={(event) => cell.isCurrentMonth && handleHover(cell.data, event)}
                      onMouseLeave={() => setHoveredDay(null)}
                      onClick={() => cell.isCurrentMonth && setSelectedDayKey(cell.data.key)}
                      className={`relative aspect-square rounded-xl flex flex-col px-2 py-1.5 text-sm transition-all duration-200 ${
                        cell.isCurrentMonth
                          ? hasStudy
                            ? 'border hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_10px_24px_rgba(15,23,42,0.42)] cursor-pointer'
                            : 'bg-slate-950/72 border opacity-80 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_10px_24px_rgba(15,23,42,0.3)] cursor-pointer'
                          : 'bg-slate-950/15 border text-slate-700 opacity-45 cursor-default'
                      } ${isToday ? 'ring-1 ring-indigo-400 shadow-[0_0_0_1px_rgba(99,102,241,0.25),0_0_20px_rgba(99,102,241,0.25)]' : ''} ${selected ? 'ring-1 ring-cyan-300/80' : ''} ${dropTargetKey === cell.data.key ? 'ring-1 ring-cyan-400/80' : ''}`}
                      style={{
                        borderColor: hasStudy && cell.isCurrentMonth ? activeBorder : 'rgba(255,255,255,0.06)',
                        background: hasStudy && cell.isCurrentMonth
                          ? `linear-gradient(160deg, ${activeBgTop} 0%, ${activeBgBottom} 100%)`
                          : undefined,
                      }}
                    >
                      <span className={`self-start text-[11px] font-semibold leading-none ${isToday ? 'text-indigo-200' : cell.isCurrentMonth ? 'text-slate-200' : 'text-slate-700'}`}>
                        {cell.date.getDate()}
                      </span>
                      {hasStudy && (
                        <div className="mt-auto w-full text-left leading-tight">
                          <p className={`text-[10px] font-semibold ${cell.isCurrentMonth ? 'text-cyan-100' : 'text-slate-700'}`}>
                            {cell.data.hours}h
                          </p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-300">
                            {Array.from({ length: sessionDotCount }, (_, dotIndex) => (
                              <span key={dotIndex} className="w-1 h-1 rounded-full bg-blue-400" />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="absolute top-1 right-1 flex items-center gap-0.5">
                        {hasCompletedGoal && <span className="w-1 h-1 rounded-full bg-emerald-400" title="Completed goal" />}
                        {hasMissedGoal && <span className="w-1 h-1 rounded-full bg-rose-400" title="Missed goal" />}
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                <div className="flex items-center gap-1.5"><GripVertical size={12} className="text-slate-500" />Drag a session onto a day to reschedule</div>
              </div>
        </CardContent>
      </Card>

      {hoveredDay && (
        <div
          className="fixed z-40 pointer-events-none w-[200px] rounded-[10px] border px-3 py-3 text-xs"
          style={{
            left: hoveredDay.x,
            top: hoveredDay.y,
            background: '#0f172a',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <p className="text-sm font-semibold text-slate-100 mb-2">{formatDate(hoveredDay.data.date, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <div className="space-y-1.5 text-xs">
            <p className="text-blue-300">Study sessions: {hoveredDay.data.daySessions.length}</p>
            <p className="text-cyan-300">Hours studied: {hoveredDay.data.hours}h</p>
            <p className="text-emerald-300">Completed goals: {hoveredDay.data.completedGoals.length}</p>
            <p className="text-rose-300">Missed goals: {hoveredDay.data.missedGoals.length}</p>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(selectedDayData)}
        onClose={() => setSelectedDayKey(null)}
        title={selectedDayData ? formatDate(selectedDayData.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
        description={selectedDayData ? `${selectedDayData.daySessions.length} session${selectedDayData.daySessions.length !== 1 ? 's' : ''} · ${selectedDayData.hours}h studied` : ''}
        size="xl"
      >
        {selectedDayData && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3 text-center">
                <p className="text-lg font-semibold text-blue-300">{selectedDayData.daySessions.length}</p>
                <p className="text-[11px] text-slate-500">study sessions</p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3 text-center">
                <p className="text-lg font-semibold text-cyan-300">{selectedDayData.hours}h</p>
                <p className="text-[11px] text-slate-500">studied</p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3 text-center">
                <p className="text-lg font-semibold text-emerald-300">{selectedDayData.completedGoals.length}</p>
                <p className="text-[11px] text-slate-500">completed goals</p>
              </div>
              <div className="rounded-xl border border-slate-800/70 bg-slate-900/35 px-4 py-3 text-center">
                <p className="text-lg font-semibold text-rose-300">{selectedDayData.missedGoals.length}</p>
                <p className="text-[11px] text-slate-500">missed goals</p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">Session History</h3>
                  <p className="text-xs text-slate-500">Drag a session onto another day in the calendar</p>
                </div>
                {selectedDayData.daySessions.length > 0 ? (
                  selectedDayData.daySessions.map((session) => (
                    <div
                      key={session.id}
                      draggable
                      onDragStart={() => setDragSessionId(session.id)}
                      onDragEnd={() => {
                        setDragSessionId(null)
                        setDropTargetKey(null)
                      }}
                      className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-3 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical size={14} className="text-slate-500 mt-1 shrink-0" />
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ background: `${getSubjectColor(session.subject)}20`, color: getSubjectColor(session.subject) }}>
                          {(session.subject ?? 'GN').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-100 truncate">{session.topic}</p>
                            <span className="text-xs text-slate-500 whitespace-nowrap">{formatDuration(getSessionDuration(session))}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{session.subject || 'General'}{session.start_time ? ` · ${formatTime(session.start_time)}` : ''}</p>
                          {session.notes && <p className="text-sm text-slate-400 mt-2 leading-6">{session.notes}</p>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-800/70 px-4 py-8 text-center text-sm text-slate-500">No study sessions logged for this day.</div>
                )}
              </div>

              <div className="space-y-3">
                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Subjects studied</h3>
                  {selectedDayData.subjects.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedDayData.subjects.map((subject) => (
                        <Badge key={subject} variant="cyan">{subject}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No subjects recorded.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-4">
                  <h3 className="text-sm font-semibold text-slate-200 mb-3">Goal activity</h3>
                  <div className="space-y-2">
                    {selectedDayData.completedGoals.map((goal) => (
                      <div key={`completed-${goal.id}`} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="truncate">{goal.title}</span>
                      </div>
                    ))}
                    {selectedDayData.missedGoals.map((goal) => (
                      <div key={`missed-${goal.id}`} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        <span className="truncate">{goal.title}</span>
                      </div>
                    ))}
                    {selectedDayData.completedGoals.length === 0 && selectedDayData.missedGoals.length === 0 && (
                      <p className="text-sm text-slate-500">No goal events for this day.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
