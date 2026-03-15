import { useState } from 'react'
import { Plus, Pencil, Trash2, Clock, BookOpen, Search, AlertCircle, X, Check, Sparkles, CalendarDays, ListFilter } from 'lucide-react'
import Card, { CardContent, StatCard } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Textarea, Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { SkeletonRow } from '../../components/ui/Skeleton'
import { useStudySessions } from '../../hooks/useStudySessions'
import { formatDuration, getSubjectColor, getSessionDuration, getSessionTimeValue, relativeTime } from '../../lib/utils'

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Web Development',
  'Data Structures', 'Machine Learning', 'History', 'Literature', 'Economics', 'Other']

const emptyForm = {
  topic: '', subject: '', start_time: '', end_time: '',
  notes: ''
}

function SessionForm({ initial = emptyForm, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.topic || !form.subject) return
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Study Topic *" placeholder="e.g. React Hooks" value={form.topic} onChange={set('topic')} />
      <Select label="Subject *" value={form.subject} onChange={set('subject')}>
        <option value="">Select subject…</option>
        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Start Time" type="time" value={form.start_time} onChange={set('start_time')} />
        <Input label="End Time" type="time" value={form.end_time} onChange={set('end_time')} />
      </div>
      <Textarea label="Notes (optional)" placeholder="What did you learn? Any key takeaways?" value={form.notes} onChange={set('notes')} rows={3} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>Save session</Button>
      </div>
    </form>
  )
}

function getSessionGroupKey(dateValue) {
  const date = new Date(dateValue)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const lastWeekStart = new Date(today)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const target = new Date(date)
  target.setHours(0, 0, 0, 0)

  if (target.getTime() === today.getTime()) return 'today'
  if (target.getTime() === yesterday.getTime()) return 'yesterday'
  if (target >= lastWeekStart) return 'last-week'
  return 'older'
}

function getSessionGroupLabel(groupKey) {
  return {
    today: 'Today',
    yesterday: 'Yesterday',
    'last-week': 'Last 7 Days',
    older: 'Older Sessions',
  }[groupKey]
}

export default function StudyTracker() {
  const { sessions, todayMinutes, loading, addSession, updateSession, deleteSession, toggleSessionCompletion } = useStudySessions()
  const [addOpen, setAddOpen] = useState(false)
  const [editSession, setEditSession] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [togglingSessions, setTogglingSessions] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filterSubject, setFilterSubject] = useState('')
  const [error, setError] = useState('')

  const handleAdd = async (form) => {
    setSaving(true)
    const { error: err } = await addSession(form)
    setSaving(false)
    if (err) { setError(err.message); return }
    setAddOpen(false)
    setError('')
  }

  const handleEdit = async (form) => {
    setSaving(true)
    const { error: err } = await updateSession(editSession.id, form)
    setSaving(false)
    if (err) {
      setError(err.message ?? 'Failed to update session')
      return
    }
    setError('')
    setEditSession(null)
  }

  const handleDelete = async () => {
    await deleteSession(deleteId)
    setDeleteId(null)
  }

  const handleToggleSessionCompletion = async (sessionId, isCompleting) => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return
    if (session.completed === true && isCompleting === false) return

    setTogglingSessions(prev => new Set(prev).add(sessionId))
    const { error: err } = await toggleSessionCompletion(sessionId, isCompleting)
    setTogglingSessions(prev => {
      const next = new Set(prev)
      next.delete(sessionId)
      return next
    })
    if (err) setError(err.message ?? 'Failed to update session completion')
  }

  // Filter
  const filtered = sessions.filter(s => {
    const matchSearch = !search || s.topic?.toLowerCase().includes(search.toLowerCase()) || s.subject?.toLowerCase().includes(search.toLowerCase())
    const matchSubject = !filterSubject || s.subject === filterSubject
    return matchSearch && matchSubject
  })

  const grouped = filtered.reduce((acc, session) => {
    const key = getSessionGroupKey(session.created_at)
    if (!acc[key]) acc[key] = []
    acc[key].push(session)
    return acc
  }, {})

  const orderedGroups = ['today', 'yesterday', 'last-week', 'older']
    .filter(key => grouped[key]?.length)
    .map(key => [key, grouped[key].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))])

  const getDuration = (s) => {
    return getSessionDuration(s)
  }

  const totalToday = (todayMinutes / 60).toFixed(1)
  const todaySessionCount = sessions.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length
  const completedTodayCount = sessions.filter(session => session.completed === true && new Date(session.created_at).toDateString() === new Date().toDateString()).length
  const completedCount = filtered.filter(session => session.completed === true).length
  const analytics = [
    { label: 'Total today', value: `${totalToday}h`, meta: `${todaySessionCount} sessions`, icon: Clock, color: 'text-indigo-300', shell: 'from-indigo-500/15 to-indigo-500/5 border-indigo-500/20' },
    { label: 'Completed today', value: `${completedTodayCount}`, meta: todaySessionCount ? `${Math.round((completedTodayCount / todaySessionCount) * 100)}% of today's sessions checked off` : 'No sessions logged today', icon: Check, color: 'text-cyan-300', shell: 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/20' },
    { label: 'Completion rate', value: `${filtered.length ? Math.round((completedCount / filtered.length) * 100) : 0}%`, meta: `${completedCount}/${filtered.length} completed`, icon: Sparkles, color: 'text-emerald-300', shell: 'from-emerald-500/15 to-emerald-500/5 border-emerald-500/20' },
  ]

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Study Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            Today: <span className="text-indigo-400 font-semibold">{totalToday}h</span> studied across{' '}
            <span className="text-indigo-400 font-semibold">
              {sessions.filter(s => new Date(s.created_at).toDateString() === new Date().toDateString()).length}
            </span> sessions
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} leftIcon={<Plus size={16} />}>
          Log study session
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {analytics.map(item => {
          const Icon = item.icon
          return (
            <StatCard
              key={item.label}
              icon={<Icon size={18} />}
              label={item.label}
              value={item.value}
              meta={item.meta}
              color={item.label === 'Total today' ? 'indigo' : item.label === 'Completed today' ? 'cyan' : 'emerald'}
            />
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search topics or subjects…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
              <X size={14} />
            </button>
          )}
        </div>
        <Select
          leftIcon={<ListFilter size={15} />}
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="sm:w-56"
        >
          <option value="">All subjects</option>
          {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>

      {/* Sessions timeline */}
      {loading ? (
        <Card>
          <CardContent className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <BookOpen size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No sessions found</p>
            <p className="text-sm text-slate-600 mt-1">
              {sessions.length === 0 ? 'Log your first study session to get started.' : 'Try adjusting your filters.'}
            </p>
            {sessions.length === 0 && (
              <Button className="mt-4" onClick={() => setAddOpen(true)} leftIcon={<Plus size={15} />}>
                Log first session
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        orderedGroups.map(([groupKey, daySessions]) => {
          const dayMinutes = daySessions.reduce((acc, s) => acc + getDuration(s), 0)
          return (
            <div key={groupKey} className="space-y-2">
              {/* Day header */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-300">
                    {getSessionGroupLabel(groupKey)}
                  </span>
                  {groupKey === 'today' && <Badge variant="indigo" dot>Live</Badge>}
                </div>
                <div className="flex-1 h-px bg-slate-800/60" />
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <Clock size={11} />
                  {formatDuration(dayMinutes)}
                </span>
              </div>

              <div className="relative pl-6 space-y-3 before:absolute before:left-[8px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-indigo-500/50 before:via-slate-700/70 before:to-transparent">
                {daySessions.map(session => {
                  const duration = getDuration(session)
                  const color = getSubjectColor(session.subject)
                  const isCompleted = session.completed === true
                  const sessionDate = new Date(session.created_at)
                  return (
                    <div key={session.id} className="relative">
                      <span className={`absolute -left-6 top-7 w-4 h-4 rounded-full border-2 ${isCompleted ? 'bg-emerald-400/20 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.45)]' : 'bg-slate-900 border-indigo-400/70 shadow-[0_0_12px_rgba(99,102,241,0.28)]'}`} />
                      <Card className="card-hover border-slate-800/70 bg-slate-950/65 backdrop-blur-sm">
                      <CardContent className="py-4">
                        <div className="flex items-start gap-4">
                          {/* Subject icon */}
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ background: `${color}20`, color }}
                          >
                            {(session.subject ?? 'GN').slice(0, 2).toUpperCase()}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 flex-wrap">
                              <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {session.topic}
                              </p>
                              <Badge variant="default" className="text-[10px]">{session.subject}</Badge>
                              {isCompleted && <Badge variant="emerald" className="text-[10px]">Completed</Badge>}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              {session.start_time && (
                                <span className="text-xs text-slate-500">
                                  {getSessionTimeValue(session.start_time)} - {getSessionTimeValue(session.end_time)}
                                </span>
                              )}
                              <span className="text-xs font-medium text-slate-400">
                                <Clock size={10} className="inline mr-1" />
                                {formatDuration(duration)}
                              </span>
                              <span className="text-xs text-slate-700">{relativeTime(session.created_at)}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <CalendarDays size={11} />
                                {sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            {session.notes && (
                              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{session.notes}</p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleToggleSessionCompletion(session.id, !isCompleted)}
                              disabled={togglingSessions.has(session.id) || isCompleted}
                              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all disabled:opacity-50"
                              style={{
                                borderColor: isCompleted ? 'rgba(16,185,129,0.45)' : 'rgba(71,85,105,0.7)',
                                background: isCompleted ? 'rgba(16,185,129,0.12)' : 'transparent',
                              }}
                              title={isCompleted ? 'Mark as not completed' : 'Mark as completed'}
                            >
                              {isCompleted ? <Check size={13} className="text-emerald-400" /> : <span className="w-3 h-3 rounded-sm border border-slate-500" />}
                            </button>
                            <button
                              disabled={isCompleted}
                              onClick={() => setEditSession(session)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                              title={isCompleted ? 'Completed sessions cannot be edited' : 'Edit session'}
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => setDeleteId(session.id)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => { setAddOpen(false); setError('') }} title="Log Study Session" description="Track what you just studied">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        <SessionForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editSession} onClose={() => setEditSession(null)} title="Edit Session">
        {editSession && (
          <SessionForm
            initial={{
              ...editSession,
              start_time: getSessionTimeValue(editSession.start_time),
              end_time: getSessionTimeValue(editSession.end_time),
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditSession(null)}
            loading={saving}
          />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Session" size="sm">
        <p className="text-sm text-slate-400 mb-6">This session will be permanently deleted. This cannot be undone.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
