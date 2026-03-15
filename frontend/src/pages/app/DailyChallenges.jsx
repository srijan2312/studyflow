import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Target, BookOpenCheck } from 'lucide-react'
import Card, { CardContent, CardHeader, CardTitle, StatCard } from '../../components/ui/Card'
import Progress from '../../components/ui/Progress'
import Badge from '../../components/ui/Badge'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'

function startOfLocalDay(dateLike) {
  const date = new Date(dateLike)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfLocalDay(dateLike) {
  const date = new Date(dateLike)
  date.setHours(23, 59, 59, 999)
  return date
}

function isWithinToday(timestamp) {
  if (!timestamp) return false
  const value = new Date(timestamp)
  const now = new Date()
  return value >= startOfLocalDay(now) && value <= endOfLocalDay(now)
}

function getSecondsUntilReset() {
  const now = new Date()
  const next = new Date(now)
  next.setDate(next.getDate() + 1)
  next.setHours(0, 0, 0, 0)
  return Math.max(0, Math.floor((next.getTime() - now.getTime()) / 1000))
}

function formatResetCountdown(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function DailyChallenges() {
  const { sessions, loading: sessionsLoading } = useStudySessions()
  const { goals, loading: goalsLoading } = useGoals()
  const [secondsUntilReset, setSecondsUntilReset] = useState(getSecondsUntilReset)

  const loading = sessionsLoading || goalsLoading

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsUntilReset(getSecondsUntilReset())
    }, 1000)

    return () => clearInterval(id)
  }, [])

  const challengeMetrics = useMemo(() => {
    const todaySessions = sessions.filter((session) =>
      isWithinToday(session.start_time ?? session.created_at)
    )

    const todayMinutes = todaySessions.reduce(
      (sum, session) => sum + Number(session.duration ?? 0),
      0
    )
    const todayHours = todayMinutes / 60

    const completedGoalsToday = goals.filter((goal) => {
      if (!(goal.completed === true || goal.status === 'completed' || Number(goal.progress ?? 0) >= 100)) {
        return false
      }

      const completionTimestamp = goal.completed_at ?? goal.updated_at ?? goal.created_at
      return isWithinToday(completionTimestamp)
    }).length

    return {
      studyHours: todayHours,
      sessionsCount: todaySessions.length,
      completedGoalsCount: completedGoalsToday,
    }
  }, [goals, sessions])

  const challenges = useMemo(() => {
    const items = [
      {
        code: 'study_2h',
        title: 'Study for 2 hours',
        target_value: 2,
        progress: challengeMetrics.studyHours,
        unit: 'hours',
        icon: Clock3,
      },
      {
        code: 'complete_1_goal',
        title: 'Complete 1 goal',
        target_value: 1,
        progress: challengeMetrics.completedGoalsCount,
        unit: 'goals',
        icon: Target,
      },
      {
        code: 'log_2_sessions',
        title: 'Log 2 study sessions',
        target_value: 2,
        progress: challengeMetrics.sessionsCount,
        unit: 'sessions',
        icon: BookOpenCheck,
      },
    ]

    return items.map((item) => ({
      ...item,
      completed_status: item.progress >= item.target_value,
      normalizedProgress: Math.min(item.progress, item.target_value),
    }))
  }, [challengeMetrics.completedGoalsCount, challengeMetrics.sessionsCount, challengeMetrics.studyHours])

  const completedCount = challenges.filter((item) => item.completed_status).length

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Daily Challenges</h1>
          <p className="text-sm text-slate-500 mt-1">
            Challenges reset every 24 hours. Complete all 3 before the timer ends.
          </p>
        </div>
        <Card className="w-full md:w-auto border-cyan-500/30 bg-cyan-500/10">
          <CardContent className="py-3 px-4">
            <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">Resets In</p>
            <p className="text-lg font-semibold text-cyan-100 tabular-nums">{formatResetCountdown(secondsUntilReset)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<CheckCircle2 size={18} />} label="Completed Today" value={`${completedCount} / ${challenges.length}`} meta="Challenges finished today" color="emerald" />
        <StatCard icon={<Clock3 size={18} />} label="Study Hours Today" value={`${challengeMetrics.studyHours.toFixed(1)}h`} meta="Hours credited to challenges" color="indigo" />
        <StatCard icon={<Target size={18} />} label="Sessions Logged" value={challengeMetrics.sessionsCount} meta="Sessions matched to daily goals" color="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <Card key={idx}>
                <CardContent className="py-6">
                  <div className="h-4 w-40 rounded-full bg-slate-800/80 animate-pulse" />
                  <div className="h-3 w-28 rounded-full bg-slate-800/80 animate-pulse mt-3" />
                  <div className="h-2 w-full rounded-full bg-slate-800/80 animate-pulse mt-4" />
                </CardContent>
              </Card>
            ))
          : challenges.map((challenge) => {
              const Icon = challenge.icon

              return (
                <Card
                  key={challenge.code}
                  className={
                    challenge.completed_status
                      ? 'border-emerald-400/40 bg-emerald-500/10 shadow-[0_10px_28px_rgba(16,185,129,0.16)]'
                      : 'border-slate-700/60 bg-slate-900/50'
                  }
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl border border-slate-700/70 bg-slate-950/65 flex items-center justify-center text-slate-300">
                          <Icon size={17} />
                        </div>
                        <CardTitle className="text-[0.95rem]">{challenge.title}</CardTitle>
                      </div>
                      {challenge.completed_status ? (
                        <Badge variant="emerald" className="gap-1">
                          <CheckCircle2 size={12} />
                          Done
                        </Badge>
                      ) : (
                        <Badge variant="default">In Progress</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-slate-400 mb-2">
                      Progress: {challenge.normalizedProgress.toFixed(challenge.unit === 'hours' ? 1 : 0)} / {challenge.target_value} {challenge.unit}
                    </p>
                    <Progress
                      value={challenge.normalizedProgress}
                      max={challenge.target_value}
                      color={challenge.completed_status ? 'emerald' : 'cyan'}
                      size="sm"
                    />
                  </CardContent>
                </Card>
              )
            })}
      </div>
    </div>
  )
}
