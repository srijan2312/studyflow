import { useEffect, useMemo, useRef, useState } from 'react'
import { Trophy, Flame, Target, Clock, Crown, BookOpen, Moon, CalendarCheck, Library, ListFilter, ChevronDown, Sparkles, ShieldCheck } from 'lucide-react'
import Card, { CardContent, CardHeader, CardTitle, StatCard } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Progress from '../../components/ui/Progress'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useResources } from '../../hooks/useResources'
import { useUserAchievements } from '../../hooks/useUserAchievements'
import { ACHIEVEMENT_DEFINITIONS, getAchievementProgress, getAchievementStats } from '../../lib/achievements'

const ICON_MAP = {
  BookOpen,
  Flame,
  Target,
  Clock,
  Crown,
  Moon,
  CalendarCheck,
  Library,
}

const CATEGORY_ICON_MAP = {
  All: ListFilter,
  Consistency: Flame,
  Goals: Target,
  Hidden: ShieldCheck,
  Mastery: Crown,
  Resources: Library,
  'Study Milestone': BookOpen,
  'Study Time': Clock,
  'Ultra Tier': Sparkles,
}

function CategoryDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const ActiveIcon = CATEGORY_ICON_MAP[value] ?? ListFilter

  return (
    <div className="relative w-full sm:w-72 space-y-1.5" ref={rootRef}>
      <label className="block text-sm font-medium text-slate-300">Category</label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-cyan-500/55 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.9))] px-3.5 py-2.5 text-sm text-slate-100 transition-all duration-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_0_1px_rgba(34,211,238,0.2),0_0_20px_rgba(34,211,238,0.18)]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2.5">
            <ActiveIcon size={15} className="text-cyan-300" />
            <span>{value}</span>
          </span>
          <ChevronDown size={15} className={`text-cyan-300 transition-transform duration-200 ${open ? 'rotate-180' : 'rotate-0'}`} />
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 z-[200] mt-1 w-full overflow-hidden rounded-xl border border-slate-700/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] shadow-[0_16px_42px_rgba(0,0,0,0.45)]">
          <ul role="listbox" className="max-h-64 overflow-auto p-1.5">
            {options.map((option) => {
              const Icon = CATEGORY_ICON_MAP[option] ?? ListFilter
              const active = option === value

              return (
                <li key={option}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                    className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition-all duration-150 ${active ? 'bg-cyan-500/20 text-cyan-200' : 'text-slate-200 hover:bg-slate-800/75 hover:text-white'}`}
                    role="option"
                    aria-selected={active}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon size={14} className={active ? 'text-cyan-300' : 'text-slate-400'} />
                      <span>{option}</span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

function formatProgressValue(value) {
  if (!Number.isFinite(value)) return '0'
  if (Math.abs(value - Math.round(value)) < 0.001) return String(Math.round(value))
  return value.toFixed(1)
}

export default function Achievements() {
  const [categoryFilter, setCategoryFilter] = useState('All')
  const { sessions, loading: sessionsLoading } = useStudySessions()
  const { goals, completedGoals, loading: goalsLoading } = useGoals()
  const { resources, loading: resourcesLoading } = useResources()
  const { achievements: unlockedRows, loading: unlockedLoading } = useUserAchievements()

  const loading = sessionsLoading || goalsLoading || resourcesLoading || unlockedLoading

  const stats = useMemo(() => {
    const summary = getAchievementStats({ sessions, completedGoals, resources })
    return {
      study_sessions: summary.study_sessions,
      streak_days: summary.streak_days,
      completed_goals: summary.completed_goals,
      total_study_hours: summary.total_study_hours,
      after_midnight_sessions: summary.after_midnight_sessions,
      resources_added: summary.resources_added,
      sessionsCount: summary.study_sessions,
      streak: summary.streak_days,
      completedGoalsCount: summary.completed_goals,
      totalHours: summary.total_study_hours,
      resourcesCount: summary.resources_added,
      totalGoals: goals.length,
    }
  }, [completedGoals, goals.length, resources, sessions])

  const achievements = useMemo(() => {
    const unlockedCodes = new Set(unlockedRows.map((row) => row.code))

    const all = ACHIEVEMENT_DEFINITIONS.map((def) => ({
      ...def,
      icon: ICON_MAP[def.icon] ?? Trophy,
      unlocked: unlockedCodes.has(def.code),
    }))

    return {
      all,
      unlocked: all.filter((item) => item.unlocked),
      locked: all.filter((item) => !item.unlocked && !item.hidden),
    }
  }, [unlockedRows])

  const categoryOptions = useMemo(() => {
    const categories = new Set([
      ...achievements.unlocked.map((item) => item.category),
      ...achievements.locked.map((item) => item.category),
    ])
    return ['All', ...Array.from(categories).sort((a, b) => a.localeCompare(b))]
  }, [achievements.locked, achievements.unlocked])

  const filteredUnlocked = useMemo(() => {
    if (categoryFilter === 'All') return achievements.unlocked
    return achievements.unlocked.filter((item) => item.category === categoryFilter)
  }, [achievements.unlocked, categoryFilter])

  const filteredLocked = useMemo(() => {
    if (categoryFilter === 'All') return achievements.locked
    return achievements.locked.filter((item) => item.category === categoryFilter)
  }, [achievements.locked, categoryFilter])

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Achievements</h1>
        <p className="text-sm text-slate-500 mt-1">Unlock badges by studying consistently and completing goals.</p>
      </div>

      <div className="flex items-start gap-3">
        <CategoryDropdown
          options={categoryOptions}
          value={categoryFilter}
          onChange={setCategoryFilter}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(() => {
          const displayedTotal = achievements.unlocked.length + achievements.locked.length
          return [
            { label: 'Unlocked Badges', value: achievements.unlocked.length, meta: `${displayedTotal} total`, icon: <Trophy size={18} />, color: 'amber' },
            { label: 'Current Streak', value: stats.streak, meta: 'Days in a row', icon: <Flame size={18} />, color: 'rose' },
            { label: 'Total Study', value: `${stats.totalHours.toFixed(1)}h`, meta: `${stats.sessionsCount} sessions`, icon: <Clock size={18} />, color: 'indigo' },
          ]
        })().map((item) => (
          <StatCard key={item.label} icon={item.icon} label={item.label} value={item.value} meta={item.meta} color={item.color} />
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-emerald-400" />
            <CardTitle>Unlocked Achievements</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredUnlocked.length === 0 ? (
            <p className="text-sm text-slate-500">No badges unlocked yet.</p>
          ) : (
            filteredUnlocked.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.code} className="group rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:shadow-[0_14px_32px_rgba(16,185,129,0.2)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
                      <Icon size={18} />
                    </div>
                    <Badge variant="emerald">Unlocked</Badge>
                  </div>
                  <p className="text-sm font-semibold text-slate-100 mt-3">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="indigo">{item.category}</Badge>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-slate-500" />
            <CardTitle>Locked Achievements</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          ) : filteredLocked.length === 0 ? (
            <p className="text-sm text-slate-500">No locked badges in this category.</p>
          ) : filteredLocked.map((item) => {
            const Icon = item.icon
            const progress = getAchievementProgress(item.code, stats)
            const currentValue = Math.min(progress.current, progress.target)
            return (
              <div key={item.code} className="rounded-xl border border-slate-800/70 bg-slate-950/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 hover:bg-slate-900/55 hover:shadow-[0_12px_24px_rgba(0,0,0,0.28)]">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-400 flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <Badge variant="default">Locked</Badge>
                </div>
                <p className="text-sm font-semibold text-slate-300 mt-3">{item.title}</p>
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="default">{item.category}</Badge>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-xs text-slate-400">
                    Progress: {formatProgressValue(currentValue)} / {formatProgressValue(progress.target)} {progress.label}
                  </p>
                  <Progress
                    value={currentValue}
                    max={progress.target}
                    color="cyan"
                    size="sm"
                    className="opacity-95"
                  />
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
