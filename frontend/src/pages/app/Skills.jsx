import { useState } from 'react'
import { Plus, Pencil, Trash2, Zap } from 'lucide-react'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import Progress, { CircularProgress } from '../../components/ui/Progress'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useSkills } from '../../hooks/useSkills'
import { DIFFICULTY_MAP } from '../../lib/utils'

const SKILL_COLORS = [
  '#6366f1', '#8b5cf6', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#ec4899', '#3b82f6',
]

const emptyForm = {
  skill_name: '', category: '', progress: 0,
  hours_spent: 0, difficulty_rating: 3, description: ''
}

function SkillForm({ initial = emptyForm, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <Input label="Skill Name *" placeholder="e.g. React.js, Data Structures" value={form.skill_name} onChange={set('skill_name')} />
      <Select label="Category" value={form.category} onChange={set('category')}>
        <option value="">Select category…</option>
        {['Programming', 'Mathematics', 'Science', 'Languages', 'Design', 'Business', 'Other'].map(c => (
          <option key={c} value={c}>{c}</option>
        ))}
      </Select>
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Progress: {form.progress}%
        </label>
        <input type="range" min="0" max="100" value={form.progress} onChange={set('progress')} className="w-full accent-indigo-500" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Hours Spent" type="number" min="0" placeholder="0" value={form.hours_spent} onChange={set('hours_spent')} />
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
          <div className="flex gap-1.5">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setForm(f => ({ ...f, difficulty_rating: n }))}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  form.difficulty_rating == n
                    ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                    : 'bg-slate-800/60 border-slate-700/40 text-slate-500'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>Save skill</Button>
      </div>
    </form>
  )
}

export default function Skills() {
  const { skills, loading, addSkill, updateSkill, deleteSkill } = useSkills()
  const [addOpen, setAddOpen] = useState(false)
  const [editSkill, setEditSkill] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAdd = async (form) => {
    if (!form.skill_name) return
    setSaving(true)
    await addSkill(form)
    setSaving(false)
    setAddOpen(false)
  }

  const handleEdit = async (form) => {
    setSaving(true)
    await updateSkill(editSkill.id, form)
    setSaving(false)
    setEditSkill(null)
  }

  const avgProgress = skills.length
    ? Math.round(skills.reduce((a, s) => a + (s.progress ?? 0), 0) / skills.length)
    : 0

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Skills</h1>
          <p className="text-sm text-slate-500 mt-1">
            <span className="text-indigo-400 font-semibold">{skills.length}</span> skills tracked ·{' '}
            Average mastery <span className="text-purple-400 font-semibold">{avgProgress}%</span>
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)} leftIcon={<Plus size={16} />}>Add skill</Button>
      </div>

      {/* Overall progress ring */}
      {skills.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-8">
            <CircularProgress value={avgProgress} size={100} strokeWidth={8} color="#6366f1">
              <div className="text-center">
                <p className="text-xl font-black gradient-text">{avgProgress}%</p>
                <p className="text-[9px] text-slate-600">avg</p>
              </div>
            </CircularProgress>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total skills', value: skills.length },
                { label: 'Mastered (80%+)', value: skills.filter(s => s.progress >= 80).length },
                { label: 'In progress', value: skills.filter(s => s.progress > 0 && s.progress < 80).length },
                { label: 'Total hours', value: `${skills.reduce((a, s) => a + Number(s.hours_spent ?? 0), 0)}h` },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-xl font-bold text-slate-100">{value}</p>
                  <p className="text-xs text-slate-600 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Skills grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : skills.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Zap size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No skills added yet</p>
            <p className="text-sm text-slate-600 mt-1">Begin tracking your skill progress today.</p>
            <Button className="mt-4" onClick={() => setAddOpen(true)} leftIcon={<Plus size={15} />}>Add first skill</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {skills.map((skill, idx) => {
            const color = SKILL_COLORS[idx % SKILL_COLORS.length]
            const diff = DIFFICULTY_MAP[skill.difficulty_rating]
            const levelLabel = skill.progress >= 80 ? 'Expert' : skill.progress >= 50 ? 'Intermediate' : skill.progress >= 20 ? 'Beginner' : 'Novice'

            return (
              <Card key={skill.id} hover className="group">
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ background: `${color}20`, color }}>
                        {skill.skill_name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-100 truncate">{skill.skill_name}</p>
                        <p className="text-xs text-slate-600">{skill.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditSkill(skill)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => setDeleteId(skill.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Circular + stats */}
                  <div className="flex items-center gap-4">
                    <CircularProgress value={skill.progress ?? 0} size={72} strokeWidth={6} color={color}>
                      <span className="text-sm font-bold" style={{ color }}>{skill.progress ?? 0}%</span>
                    </CircularProgress>
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Hours</span>
                        <span className="text-slate-300 font-medium">{skill.hours_spent ?? 0}h</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">Level</span>
                        <span className="font-medium" style={{ color }}>{levelLabel}</span>
                      </div>
                      {diff && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Difficulty</span>
                          <span className="font-medium" style={{ color: diff.color }}>{diff.label}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full overflow-hidden bg-slate-800/80">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${skill.progress ?? 0}%`, background: `linear-gradient(90deg, ${color}, ${color}bb)`, boxShadow: `0 0 8px ${color}50` }} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Skill" description="Track a new skill you're developing">
        <SkillForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>
      <Modal open={!!editSkill} onClose={() => setEditSkill(null)} title="Edit Skill">
        {editSkill && <SkillForm initial={editSkill} onSubmit={handleEdit} onCancel={() => setEditSkill(null)} loading={saving} />}
      </Modal>
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Skill" size="sm">
        <p className="text-sm text-slate-400 mb-6">This skill will be permanently deleted.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="danger" className="flex-1" onClick={async () => { await deleteSkill(deleteId); setDeleteId(null) }}>Delete</Button>
        </div>
      </Modal>
    </div>
  )
}
