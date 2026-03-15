import { useEffect, useMemo, useState } from 'react'
import { BookCheck, Plus, Trash2 } from 'lucide-react'
import Card, { CardContent, CardHeader, CardTitle, StatCard } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Input, { Select } from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { useTopicMastery } from '../../hooks/useTopicMastery'

const TOPIC_STATUSES = {
  not_started: { label: 'Not Started', variant: 'amber' },
  practicing: { label: 'Practicing', variant: 'indigo' },
  completed: { label: 'Completed', variant: 'emerald' },
}

const STATUS_ORDER = ['not_started', 'practicing', 'completed']

function normalizeTopicName(value) {
  return String(value || '').trim().toLowerCase()
}

function getFreshnessLabel(updatedAt) {
  if (!updatedAt) return 'No recent update'
  const updated = new Date(updatedAt)
  if (Number.isNaN(updated.getTime())) return 'No recent update'

  const now = new Date()
  const diffMs = now.getTime() - updated.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays <= 0) return 'Updated today'
  if (diffDays === 1) return 'Updated yesterday'
  return `Updated ${diffDays}d ago`
}

function getStatusGuidance(status) {
  if (status === 'completed') {
    return {
      title: 'Retention Move',
      detail: 'Do one 10-minute recap this week so the topic stays sharp.',
      tone: 'text-emerald-300',
      shell: 'bg-emerald-500/8 border-emerald-500/20',
    }
  }

  if (status === 'practicing') {
    return {
      title: 'Momentum Move',
      detail: 'Finish one concrete subtask next and note one blocker you hit.',
      tone: 'text-indigo-300',
      shell: 'bg-indigo-500/8 border-indigo-500/20',
    }
  }

  return {
    title: 'Kickoff Move',
    detail: 'Start with a 20-minute intro session and define 3 key concepts.',
    tone: 'text-amber-300',
    shell: 'bg-amber-500/8 border-amber-500/20',
  }
}

function isNeedsAttention(status, createdAt, updatedAt) {
  if (status !== 'not_started') return false
  const baseDate = createdAt || updatedAt
  if (!baseDate) return false

  const started = new Date(baseDate)
  if (Number.isNaN(started.getTime())) return false

  const diffDays = Math.floor((Date.now() - started.getTime()) / 86400000)
  return diffDays > 3
}

export default function TopicMastery() {
  const { topics, loading, error, addTopic: addTopicDb, updateTopicStatus: updateTopicStatusDb, deleteTopic: deleteTopicDb } = useTopicMastery()
  const [topicInput, setTopicInput] = useState('')
  const [topicStatus, setTopicStatus] = useState('not_started')
  const [formError, setFormError] = useState('')

  const checkpoints = useMemo(() => {
    return topics
      .filter((item) => item?.subject && TOPIC_STATUSES[item?.status])
      .map((item) => {
        const status = item.status
        const badge = TOPIC_STATUSES[status]
        const guidance = getStatusGuidance(status)
        return {
          id: item.id,
          subject: item.subject,
          status,
          badge,
          guidance,
          freshness: getFreshnessLabel(item.updated_at),
          needsAttention: isNeedsAttention(status, item.created_at, item.updated_at),
        }
      })
      .sort((a, b) => a.subject.localeCompare(b.subject))
  }, [topics])

  const trackedTopics = checkpoints.length
  const completedTopics = checkpoints.filter((item) => item.status === 'completed').length

  const addTopic = async (e) => {
    e.preventDefault()
    const subject = topicInput.trim()
    if (!subject) return

    const key = normalizeTopicName(subject)
    const exists = topics.some((item) => normalizeTopicName(item.subject) === key)
    if (exists) {
      setFormError('Topic already exists. Update it from the card dropdown.')
      return
    }

    const { error: addError } = await addTopicDb({ subject, status: topicStatus })
    if (addError) {
      setFormError(addError.message ?? 'Unable to save topic')
      return
    }

    setFormError('')
    setTopicInput('')
    setTopicStatus('not_started')
  }

  const updateTopicStatus = async (id, status) => {
    const { error: updateError } = await updateTopicStatusDb(id, status)
    if (updateError) {
      setFormError(updateError.message ?? 'Unable to update topic status')
      return
    }

    if (formError) setFormError('')
  }

  const removeManualTopic = async (id) => {
    const { error: deleteError } = await deleteTopicDb(id)
    if (deleteError) {
      setFormError(deleteError.message ?? 'Unable to delete topic')
      return
    }

    if (formError) setFormError('')
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Topic Mastery</h1>
        <p className="text-sm text-slate-500 mt-1">Manual tracker: add any topic (for example React) and tag it as Not Started, Practicing, or Completed.</p>
      </div>

      <Card className="relative z-40 overflow-visible">
        <CardHeader>
          <CardTitle>Add Topic</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addTopic} className="grid grid-cols-1 md:grid-cols-[1fr_200px_auto] gap-3 items-center">
            <Input
              placeholder="e.g. Organic Chemistry"
              value={topicInput}
              onChange={(e) => {
                setTopicInput(e.target.value)
                if (formError) setFormError('')
              }}
            />
            <Select value={topicStatus} onChange={(e) => setTopicStatus(e.target.value)}>
              <option value="not_started">Not Started</option>
              <option value="practicing">Practicing</option>
              <option value="completed">Completed</option>
            </Select>
            <Button type="submit" leftIcon={<Plus size={14} />}>Save topic</Button>
          </form>
          {formError && <p className="text-xs text-red-400 mt-2">{formError}</p>}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard icon={<BookCheck size={18} />} label="Tracked Topics" value={trackedTopics} meta="Topics in your mastery map" color="cyan" />
        <StatCard icon={<BookCheck size={18} />} label="Completed Topics" value={completedTopics} meta="Topics fully checked off" color="emerald" />
        <StatCard icon={<BookCheck size={18} />} label="Practicing Topics" value={checkpoints.filter((item) => item.status === 'practicing').length} meta="Topics currently in progress" color="amber" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookCheck size={16} className="text-cyan-400" />
            <CardTitle>Checkpoints</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">Loading topics…</p>
            </div>
          ) : checkpoints.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-slate-500">No topics yet</p>
              <p className="text-xs text-slate-600 mt-1">Add your first topic above and choose a status tag.</p>
            </div>
          ) : (
            checkpoints.map((item) => (
              <div key={item.subject} className="rounded-xl border border-slate-800/70 bg-slate-950/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm text-slate-200 font-medium truncate">{item.subject}</p>
                    {item.needsAttention && (
                      <Badge variant="rose" className="text-[10px] px-2 py-0.5">Needs Attention</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center rounded-xl border border-slate-700/60 bg-slate-900/70 p-1">
                      {STATUS_ORDER.map((statusKey) => {
                        const isActive = item.status === statusKey
                        const activeClass = statusKey === 'completed'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : statusKey === 'practicing'
                            ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'

                        return (
                          <button
                            key={statusKey}
                            type="button"
                            onClick={() => updateTopicStatus(item.id, statusKey)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                              isActive
                                ? activeClass
                                : 'text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {TOPIC_STATUSES[statusKey].label}
                          </button>
                        )
                      })}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeManualTopic(item.id)}
                      className="w-8 h-8 rounded-lg border border-slate-700/60 text-slate-500 hover:text-red-400 hover:border-red-500/40 transition-colors"
                      title="Remove topic"
                    >
                      <Trash2 size={13} className="mx-auto" />
                    </button>
                  </div>
                </div>
                <div className={`rounded-xl border px-3 py-2.5 ${item.guidance.shell}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold ${item.guidance.tone}`}>{item.guidance.title}</p>
                    <span className="text-[11px] text-slate-500">{item.freshness}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-5">{item.guidance.detail}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
