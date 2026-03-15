import { useState } from 'react'
import { Plus, Pencil, Trash2, Target, Clock, Check, Sparkles, PartyPopper, CalendarDays, PlusCircle, X } from 'lucide-react'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useGoals } from '../../hooks/useGoals'
import { formatDate } from '../../lib/utils'

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'Web Development', 'Data Structures', 'Machine Learning', 'History', 'Literature', 'Other']

const emptyForm = {
  title: '', subject: '', deadline: '', priority: 'medium',
  description: '',
  checklist: [{ id: `item-${Date.now()}`, text: '', completed: false }],
}

const PRIORITY_BADGE = {
  low: 'emerald', medium: 'amber', high: 'orange', urgent: 'rose'
}

function GoalForm({ initial = emptyForm, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    ...initial,
    checklist: Array.isArray(initial.checklist) && initial.checklist.length
      ? initial.checklist.map((item, index) => ({
          id: item.id || `item-${Date.now()}-${index}`,
          text: item.text || '',
          completed: item.completed === true,
        }))
      : [{ id: `item-${Date.now()}`, text: '', completed: false }],
  })
  const [formError, setFormError] = useState('')
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const addChecklistItem = () => {
    setForm(prev => ({
      ...prev,
      checklist: [...prev.checklist, { id: `item-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`, text: '', completed: false }],
    }))
  }

  const updateChecklistItem = (itemId, text) => {
    setForm(prev => ({
      ...prev,
      checklist: prev.checklist.map(item => item.id === itemId ? { ...item, text } : item),
    }))
  }

  const removeChecklistItem = (itemId) => {
    setForm(prev => {
      const next = prev.checklist.filter(item => item.id !== itemId)
      return {
        ...prev,
        checklist: next.length ? next : [{ id: `item-${Date.now()}`, text: '', completed: false }],
      }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanedChecklist = form.checklist
      .map(item => ({ ...item, text: item.text.trim() }))
      .filter(item => item.text)

    if (!form.title?.trim()) {
      setFormError('Goal title is required.')
      return
    }

    if (!cleanedChecklist.length) {
      setFormError('Add at least one checklist item.')
      return
    }

    setFormError('')
    onSubmit({
      ...form,
      title: form.title.trim(),
      checklist: cleanedChecklist,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Goal Title *" placeholder="e.g. Complete React Hooks chapter" value={form.title} onChange={set('title')} />
      <Select label="Subject" value={form.subject} onChange={set('subject')}>
        <option value="">Select subject…</option>
        {SUBJECTS.map(s => <option key={s}>{s}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Deadline" type="date" value={form.deadline} onChange={set('deadline')} />
        <Select label="Priority" value={form.priority} onChange={set('priority')}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-300">Checklist Items *</label>
          <button
            type="button"
            onClick={addChecklistItem}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200"
          >
            <PlusCircle size={12} /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {form.checklist.map((item, index) => (
            <div key={item.id} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-5">{index + 1}.</span>
              <Input
                placeholder={`Checklist item ${index + 1}`}
                value={item.text}
                onChange={(e) => updateChecklistItem(item.id, e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeChecklistItem(item.id)}
                className="w-9 h-9 shrink-0 rounded-xl border border-slate-700/60 text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
              >
                <X size={14} className="mx-auto" />
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">Progress is auto-calculated from completed checklist items.</p>
      </div>
      <Textarea label="Notes (optional)" placeholder="Details about this goal…" value={form.description} onChange={set('description')} rows={2} />
      {formError && <p className="text-xs text-red-400">{formError}</p>}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>Save goal</Button>
      </div>
    </form>
  )
}

export default function Goals() {
  const { goals, activeGoals, completedGoals, loading, addGoal, updateGoal, deleteGoal } = useGoals()
  const [addOpen, setAddOpen] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('active')
  const [celebratingGoalId, setCelebratingGoalId] = useState(null)

  const handleAdd = async (form) => {
    if (!form.title) return
    setSaving(true)
    await addGoal(form)
    setSaving(false)
    setAddOpen(false)
  }

  const handleEdit = async (form) => {
    setSaving(true)
    const { error: err } = await updateGoal(editGoal.id, form)
    setSaving(false)
    if (err) return
    setEditGoal(null)
  }

  const handleDelete = async () => {
    await deleteGoal(deleteId)
    setDeleteId(null)
  }

  const getDaysLeft = (deadline) => {
    if (!deadline) return null
    return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
  }

  const overdueGoals = goals.filter(goal => {
    const days = getDaysLeft(goal.deadline)
    const done = goal.completed || goal.progress >= 100
    return !done && days !== null && days < 0
  })

  const displayGoals = tab === 'active'
    ? activeGoals
    : tab === 'completed'
      ? completedGoals
      : overdueGoals

  const handleToggleChecklistItem = async (goal, itemId, isChecked) => {
    const goalLocked = goal.completed === true || goal.status === 'completed' || Number(goal.progress ?? 0) >= 100
    if (goalLocked) return

    const targetItem = (goal.checklist ?? []).find(item => item.id === itemId)
    if (!targetItem) return
    if (targetItem.completed === true && isChecked === false) return

    const nextChecklist = (goal.checklist ?? []).map(item =>
      item.id === itemId ? { ...item, completed: isChecked } : item
    )

    const completedCount = nextChecklist.filter(item => item.completed).length
    const didCompleteNow = nextChecklist.length > 0 && completedCount === nextChecklist.length
    const wasCompleted = goal.completed === true || Number(goal.progress) >= 100

    await updateGoal(goal.id, {
      ...goal,
      checklist: nextChecklist,
    })

    if (!wasCompleted && didCompleteNow) {
      setCelebratingGoalId(goal.id)
      window.setTimeout(() => setCelebratingGoalId(null), 1500)
    }
  }

  const daysLeft = (deadline) => {
    if (!deadline) return null
    const diff = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const goalTimeline = (goal) => {
    if (!goal.deadline) return null
    const done = goal.completed === true || goal.status === 'completed' || Number(goal.progress ?? 0) >= 100

    if (done) {
      return {
        pct: 100,
        remainingDays: null,
        dueLabel: formatDate(goal.deadline, { month: 'short', day: 'numeric' }),
        statusLabel: 'Completed',
      }
    }

    const start = new Date(goal.created_at || new Date())
    const end = new Date(goal.deadline)
    if (Number.isNaN(end.getTime())) return null

    const startDay = new Date(start)
    startDay.setHours(0, 0, 0, 0)

    const endDay = new Date(end)
    endDay.setHours(0, 0, 0, 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalDays = Math.max(Math.floor((endDay.getTime() - startDay.getTime()) / 86400000) + 1, 1)
    const elapsedCompletedDays = Math.max(Math.floor((today.getTime() - startDay.getTime()) / 86400000), 0)
    const completedDays = Math.min(elapsedCompletedDays, totalDays)
    const pct = Math.round((completedDays / totalDays) * 100)
    const remainingDays = daysLeft(goal.deadline)

    return {
      pct,
      remainingDays,
      dueLabel: formatDate(goal.deadline, { month: 'short', day: 'numeric' }),
      statusLabel: remainingDays < 0 ? `${Math.abs(remainingDays)}d overdue` : remainingDays === 0 ? 'Due today' : `${remainingDays}d left`,
    }
  }

  const emptyStateByTab = {
    active: {
      title: 'No goals yet',
      description: 'Create your first learning goal to get started.',
      cta: 'Create goal',
      icon: Target,
      showCta: true,
    },
    completed: {
      title: 'No completed goals yet',
      description: 'Finish checklist items to celebrate your first completed goal.',
      cta: 'View active goals',
      icon: Check,
      showCta: true,
    },
    overdue: {
      title: 'All caught up',
      description: 'Zero overdue goals. Try adding a stretch goal to keep your streak alive.',
      cta: 'Create stretch goal',
      icon: Sparkles,
      showCta: false,
    },
  }

  const emptyState = emptyStateByTab[tab] ?? emptyStateByTab.active
  const EmptyStateIcon = emptyState.icon

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Goals</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="text-indigo-400 font-semibold">{activeGoals.length}</span> active ·{' '}
            <span className="text-emerald-400 font-semibold">{completedGoals.length}</span> completed ·{' '}
            <span className="text-rose-400 font-semibold">{overdueGoals.length}</span> overdue
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} leftIcon={<Plus size={16} />}>New goal</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900/60 border border-slate-800/60 rounded-xl w-fit">
        {[['active', 'Active'], ['completed', 'Completed'], ['overdue', 'Overdue']].map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === v
                ? 'bg-indigo-500/20 text-indigo-300 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Goals grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : displayGoals.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <EmptyStateIcon size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">{emptyState.title}</p>
            <p className="text-sm text-slate-600 mt-1">{emptyState.description}</p>
            {emptyState.showCta && (
              <Button className="mt-4" onClick={() => setAddOpen(true)} leftIcon={<Plus size={15} />}>
                {emptyState.cta}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayGoals.map(goal => {
            const days = daysLeft(goal.deadline)
            const done = goal.completed || goal.progress >= 100
            const p = PRIORITY_BADGE[goal.priority] ?? 'amber'
            const checklist = goal.checklist ?? []
            const completedItems = checklist.filter(item => item.completed).length
            const timeline = goalTimeline(goal)
            return (
              <Card key={goal.id} hover className="group">
                <CardContent className="p-5 space-y-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className={`relative w-6 h-6 rounded-xl flex items-center justify-center shrink-0 transition-all ${done ? 'bg-gradient-to-br from-emerald-500/25 to-cyan-500/20 border border-emerald-400/60 shadow-[0_0_14px_rgba(16,185,129,0.25)]' : 'bg-slate-900/70 border border-slate-700/80 group-hover:border-indigo-500/50'}`}>
                        {done ? (
                          <Check size={13} className="text-emerald-300" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-slate-600 group-hover:bg-indigo-400/70 transition-colors" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold truncate ${done ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                          {goal.title}
                        </p>
                        <p className="text-xs text-slate-600 truncate">{goal.subject || 'General'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        disabled={done}
                        onClick={() => setEditGoal(goal)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        title={done ? 'Completed goals cannot be edited' : 'Edit goal'}
                      >
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteId(goal.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Deadline timeline */}
                  {timeline && (
                    <div className="space-y-1.5 border-t border-slate-800/60 pt-3">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="inline-flex items-center gap-1"><CalendarDays size={10} /> Timeline</span>
                        <span>{timeline.statusLabel}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-700 ease-out"
                          style={{ width: `${timeline.pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600">
                        <span>Start</span>
                        <span>Due {timeline.dueLabel}</span>
                      </div>
                    </div>
                  )}

                  {/* Checklist status */}
                  <div className="flex items-center justify-between text-xs border-t border-slate-800/60 pt-3">
                    <span className="text-slate-500">Checklist progress</span>
                    <span className="text-slate-300 font-medium tabular-nums">{completedItems}/{checklist.length}</span>
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2">
                    {checklist.map((item) => (
                      <button
                        key={item.id}
                        disabled={item.completed || done}
                        onClick={() => handleToggleChecklistItem(goal, item.id, !item.completed)}
                        className="w-full flex items-start gap-2.5 text-left disabled:cursor-not-allowed"
                      >
                        <span className={`mt-[2px] w-4 h-4 rounded-md border flex items-center justify-center transition-colors ${item.completed ? 'bg-emerald-500/20 border-emerald-400/60' : 'border-slate-600 hover:border-indigo-400/60'}`}>
                          {item.completed ? <Check size={10} className="text-emerald-300" /> : null}
                        </span>
                        <span className={`text-xs ${item.completed ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={p} className="text-[10px] capitalize">{goal.priority}</Badge>
                    <div className="flex items-center gap-2">
                      {goal.deadline && (
                        <span className={`text-[10px] flex items-center gap-1 font-medium ${
                          done ? 'text-emerald-400' : days !== null && days < 0 ? 'text-red-400' : days !== null && days < 3 ? 'text-amber-400' : 'text-slate-600'
                        }`}>
                          <Clock size={10} />
                          {done ? 'Completed' : days === null ? '' : days < 0 ? 'Overdue' : days === 0 ? 'Due today' : `${days}d left`}
                        </span>
                      )}
                    </div>
                  </div>

                  {celebratingGoalId === goal.id && (
                    <div className="relative h-0">
                      <div className="absolute -top-2 right-2 flex items-center gap-1 text-emerald-300">
                        <Sparkles size={12} className="animate-ping" />
                        <PartyPopper size={14} className="animate-bounce" />
                        <span className="text-[10px] font-semibold">Goal completed!</span>
                      </div>
                    </div>
                  )}

                  {goal.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 border-t border-slate-800/60 pt-3">{goal.description}</p>
                  )}
                  
                  {goal.completed_at && (
                    <p className="text-xs text-emerald-600/80 border-t border-slate-800/60 pt-3">
                      Completed {new Date(goal.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Create Goal" description="Set a new learning objective">
        <GoalForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editGoal} onClose={() => setEditGoal(null)} title="Edit Goal">
        {editGoal && (
          <GoalForm initial={editGoal} onSubmit={handleEdit} onCancel={() => setEditGoal(null)} loading={saving} />
        )}
      </Modal>

      {/* Delete confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Goal" size="sm">
        <p className="text-sm text-slate-400 mb-6">This goal will be permanently deleted.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
