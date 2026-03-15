import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Search,
  Bookmark,
  BookmarkCheck,
  Youtube,
  Globe,
  FileText,
  GraduationCap,
  BookOpen,
  Link as LinkIcon,
  Star,
} from 'lucide-react'
import Card, { CardContent, StatCard } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select, Textarea } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useResources } from '../../hooks/useResources'
import { relativeTime } from '../../lib/utils'

const RESOURCE_TYPE_KEY = 'studyflow.resources.meta.v1'
const RESOURCE_TYPES = ['Video', 'Article', 'PDF', 'Course', 'Book']

const TYPE_CONFIG = {
  Video: { icon: Youtube, color: 'rose', badge: 'rose', accent: 'from-rose-500/18 to-orange-500/10' },
  Article: { icon: Globe, color: 'cyan', badge: 'cyan', accent: 'from-cyan-500/18 to-sky-500/10' },
  PDF: { icon: FileText, color: 'purple', badge: 'purple', accent: 'from-purple-500/18 to-fuchsia-500/10' },
  Course: { icon: GraduationCap, color: 'indigo', badge: 'indigo', accent: 'from-indigo-500/18 to-blue-500/10' },
  Book: { icon: BookOpen, color: 'amber', badge: 'amber', accent: 'from-amber-500/18 to-yellow-500/10' },
  Other: { icon: Bookmark, color: 'default', badge: 'default', accent: 'from-slate-500/18 to-slate-400/10' },
}

const TYPE_OPTION_ICONS = {
  Video: <Youtube size={14} />,
  Article: <Globe size={14} />,
  PDF: <FileText size={14} />,
  Course: <GraduationCap size={14} />,
  Book: <BookOpen size={14} />,
}

const emptyForm = { title: '', category: 'Article', url: '', description: '' }

function getResourceMeta(metaMap, id) {
  return metaMap[id] ?? { bookmarked: false, rating: 0 }
}

function getHostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'link'
  }
}

function getFaviconUrl(url) {
  try {
    const { hostname } = new URL(url)
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`
  } catch {
    return ''
  }
}

function ResourceSource({ url }) {
  const [faviconError, setFaviconError] = useState(false)
  const hostname = getHostname(url)
  const faviconUrl = getFaviconUrl(url)

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      {faviconUrl && !faviconError ? (
        <img
          src={faviconUrl}
          alt=""
          className="h-4 w-4 rounded-sm"
          onError={() => setFaviconError(true)}
        />
      ) : (
        <div className="flex h-4 w-4 items-center justify-center rounded-sm bg-slate-800/80 text-slate-500">
          <Globe size={11} />
        </div>
      )}
      <span className="truncate">{hostname}</span>
    </div>
  )
}

function ResourceForm({ initial = emptyForm, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!form.title.trim() || !form.url.trim()) return
    onSubmit({
      ...form,
      title: form.title.trim(),
      url: form.url.trim(),
      description: form.description.trim(),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Title *" placeholder="e.g. React Hooks Deep Dive" value={form.title} onChange={set('title')} />
      <Input
        label="URL *"
        type="url"
        placeholder="https://"
        value={form.url}
        onChange={set('url')}
        leftIcon={<LinkIcon size={13} />}
      />
      <Select label="Resource Type" value={form.category} onChange={set('category')} optionIcons={TYPE_OPTION_ICONS}>
        {RESOURCE_TYPES.map((type) => <option key={type}>{type}</option>)}
      </Select>
      <Textarea label="Description" placeholder="Why is this worth saving?" value={form.description} onChange={set('description')} rows={3} />
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="flex-1" loading={loading}>Save resource</Button>
      </div>
    </form>
  )
}

function RatingStars({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star === value ? 0 : star)}
          className={`transition-colors ${star <= value ? 'text-amber-300' : 'text-slate-600 hover:text-slate-400'}`}
          title={`Rate ${star} star${star > 1 ? 's' : ''}`}
        >
          <Star size={13} fill={star <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export default function Resources() {
  const { resources, loading, addResource, updateResource, deleteResource } = useResources()
  const [addOpen, setAddOpen] = useState(false)
  const [editResource, setEditResource] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [metaById, setMetaById] = useState(() => {
    if (typeof window === 'undefined') return {}
    try {
      return JSON.parse(window.localStorage.getItem(RESOURCE_TYPE_KEY) || '{}')
    } catch {
      return {}
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(RESOURCE_TYPE_KEY, JSON.stringify(metaById))
  }, [metaById])

  const handleAdd = async (form) => {
    setSaving(true)
    const result = await addResource(form)
    if (!result?.error && result?.data?.id) {
      setMetaById((prev) => ({
        ...prev,
        [result.data.id]: { bookmarked: false, rating: 0 },
      }))
      setAddOpen(false)
    }
    setSaving(false)
  }

  const handleEdit = async (form) => {
    if (!editResource?.id) return
    setSaving(true)
    const result = await updateResource(editResource.id, form)
    if (!result?.error) setEditResource(null)
    setSaving(false)
  }

  const setResourceMeta = (id, updates) => {
    setMetaById((prev) => ({
      ...prev,
      [id]: {
        ...getResourceMeta(prev, id),
        ...updates,
      },
    }))
  }

  const filtered = useMemo(() => {
    return resources.filter((resource) => {
      const q = search.trim().toLowerCase()
      const matchSearch = !q
        || resource.title?.toLowerCase().includes(q)
        || resource.description?.toLowerCase().includes(q)
        || resource.url?.toLowerCase().includes(q)
      const matchType = !filterType || resource.category === filterType
      return matchSearch && matchType
    })
  }, [resources, search, filterType])

  const totalCount = resources.length
  const bookmarkedCount = useMemo(() => resources.filter((resource) => getResourceMeta(metaById, resource.id).bookmarked).length, [resources, metaById])
  const ratedCount = useMemo(() => resources.filter((resource) => getResourceMeta(metaById, resource.id).rating > 0).length, [resources, metaById])

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Resources</h1>
          <p className="text-sm text-slate-500 mt-1">Organize your learning library with categories, ratings, bookmarks, and quick previews.</p>
        </div>
        <Button onClick={() => setAddOpen(true)} leftIcon={<Plus size={16} />}>Add resource</Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, link, or notes..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50 text-sm text-slate-300 placeholder:text-slate-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
        </div>
        <Select value={filterType} onChange={(event) => setFilterType(event.target.value)} leftIcon={<Bookmark size={15} />} optionIcons={TYPE_OPTION_ICONS}>
          <option value="">All Types</option>
          {RESOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatCard icon={<BookOpen size={18} />} label="Library" value={totalCount} meta={totalCount === 1 ? '1 resource saved' : `${totalCount} resources saved`} color="amber" />
        <StatCard icon={<Bookmark size={18} />} label="Bookmarked" value={bookmarkedCount} meta={totalCount > 0 ? `${Math.round((bookmarkedCount / totalCount) * 100)}% of library starred` : 'No bookmarks yet'} color="indigo" />
        <StatCard icon={<Star size={18} />} label="Rated" value={ratedCount} meta={totalCount > 0 ? `${Math.round((ratedCount / totalCount) * 100)}% of resources reviewed` : 'No ratings yet'} color="emerald" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-20 text-center">
            <Bookmark size={40} className="text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">{resources.length === 0 ? 'No resources saved' : 'No matching resources'}</p>
            <p className="text-sm text-slate-600 mt-1">
              {resources.length === 0 ? 'Save videos, articles, books, and courses for later.' : 'Try a different filter or search term.'}
            </p>
            {resources.length === 0 && (
              <Button className="mt-4" onClick={() => setAddOpen(true)} leftIcon={<Plus size={15} />}>Add resource</Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => {
            const type = RESOURCE_TYPES.includes(resource.category) ? resource.category : 'Other'
            const config = TYPE_CONFIG[type] ?? TYPE_CONFIG.Other
            const Icon = config.icon
            const meta = getResourceMeta(metaById, resource.id)
            const iconToneClass = {
              rose: 'border-rose-500/20 text-rose-300',
              cyan: 'border-cyan-500/20 text-cyan-300',
              purple: 'border-purple-500/20 text-purple-300',
              indigo: 'border-indigo-500/20 text-indigo-300',
              amber: 'border-amber-500/20 text-amber-300',
              default: 'border-slate-700/60 text-slate-300',
            }[config.color]

            return (
              <Card
                key={resource.id}
                hover
                className={`group relative overflow-visible border-slate-800/70 bg-[linear-gradient(180deg,rgba(2,6,23,0.96),rgba(2,6,23,0.9))] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_44px_-28px_rgba(15,23,42,0.85)] ${
                  config.color === 'rose' ? 'hover:border-rose-400/35' :
                  config.color === 'cyan' ? 'hover:border-cyan-400/35' :
                  config.color === 'purple' ? 'hover:border-purple-400/35' :
                  config.color === 'indigo' ? 'hover:border-indigo-400/35' :
                  config.color === 'amber' ? 'hover:border-amber-400/35' :
                  'hover:border-slate-500/35'
                }`}
              >
                <div className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${config.accent} opacity-70 transition-opacity duration-300 group-hover:opacity-100`} />
                <CardContent className="relative flex min-h-[220px] flex-col p-0">
                  <div className="flex items-center justify-between border-b border-slate-800/70 px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setResourceMeta(resource.id, { bookmarked: !meta.bookmarked })}
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl border transition-all duration-200 ${
                        meta.bookmarked
                          ? 'border-amber-400/22 bg-amber-500/10 text-amber-300 shadow-[0_8px_22px_rgba(245,158,11,0.12)]'
                          : 'border-slate-800/80 bg-slate-950/60 text-slate-400 hover:border-slate-700/80 hover:text-slate-200'
                      }`}
                      title={meta.bookmarked ? 'Remove bookmark' : 'Bookmark resource'}
                    >
                      {meta.bookmarked ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
                    </button>

                    <div className="flex items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/60 p-1.5 shadow-[0_10px_24px_rgba(2,6,23,0.24)]">
                      <button
                        type="button"
                        onClick={() => setEditResource(resource)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-800/80 hover:text-slate-200"
                        title="Edit resource"
                      >
                        <Pencil size={15} />
                      </button>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-800/80 hover:text-indigo-300"
                        onClick={(event) => event.stopPropagation()}
                        title="Open resource"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        type="button"
                        onClick={() => setDeleteId(resource.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
                        title="Delete resource"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4 px-6 pt-5">
                    <div className="min-w-0 pr-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.badge} className="text-[10px]">{type}</Badge>
                        {meta.bookmarked && <Badge variant="amber" className="text-[10px]">Bookmarked</Badge>}
                      </div>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="mt-4 block text-lg font-semibold leading-tight text-slate-100 line-clamp-2 transition-colors hover:text-white"
                        title="Open resource"
                      >
                        {resource.title}
                      </a>
                      <div className="mt-2">
                        <ResourceSource url={resource.url} />
                      </div>
                    </div>
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-slate-950/50 shadow-[0_12px_24px_rgba(2,6,23,0.35)] transition-transform duration-300 group-hover:scale-105 ${iconToneClass}`}>
                      <Icon size={19} />
                    </div>
                  </div>

                  {resource.description && (
                    <p className="mt-4 px-6 line-clamp-3 text-sm leading-6 text-slate-400">{resource.description}</p>
                  )}

                  <div className="mt-auto px-6 pb-6 pt-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <RatingStars value={meta.rating} onChange={(rating) => setResourceMeta(resource.id, { rating })} />
                        <span className="text-[11px] text-slate-500">{meta.rating > 0 ? `${meta.rating}/5` : 'Not rated'}</span>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.14em] text-slate-600">{relativeTime(resource.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Resource" description="Save a learning resource for later">
        <ResourceForm onSubmit={handleAdd} onCancel={() => setAddOpen(false)} loading={saving} />
      </Modal>

      <Modal open={Boolean(editResource)} onClose={() => setEditResource(null)} title="Edit Resource" description="Update this learning resource">
        {editResource && (
          <ResourceForm
            initial={{
              title: editResource.title || '',
              category: editResource.category || 'Article',
              url: editResource.url || '',
              description: editResource.description || '',
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditResource(null)}
            loading={saving}
          />
        )}
      </Modal>

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete Resource" size="sm">
        <p className="text-sm text-slate-400 mb-6">This resource will be permanently removed.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              const id = deleteId
              await deleteResource(id)
              setDeleteId(null)
              setMetaById((prev) => {
                const next = { ...prev }
                delete next[id]
                return next
              })
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
