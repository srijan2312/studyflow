import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Plus,
  Search,
  Pin,
  PinOff,
  Save,
  Trash2,
  GripVertical,
  Link2,
} from 'lucide-react'
import Card, { CardContent } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { useNotes } from '../../hooks/useNotes'
import { relativeTime } from '../../lib/utils'

const DEFAULT_FOLDER = 'Unsorted'
const DRAFT_STORAGE_KEY = 'studyflow.notes.editor-draft.v2'
const ORDER_STORAGE_KEY = 'studyflow.notes.order.v1'
const AUTOSAVE_DELAY = 900
const NOTE_TITLE_FIELD_CLASS = 'rounded-2xl border border-slate-800/60 bg-[linear-gradient(180deg,rgba(15,23,42,0.3),rgba(15,23,42,0.12))] px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition-all duration-200'
const NOTE_TITLE_FOCUS_CLASS = 'focus-within:border-cyan-400/30 focus-within:shadow-[0_0_0_1px_rgba(34,211,238,0.12),inset_0_1px_0_rgba(255,255,255,0.05)]'
const NOTE_TITLE_INPUT_CLASS = 'w-full appearance-none border-0 bg-transparent text-[28px] font-bold leading-tight tracking-[-0.04em] text-slate-50 placeholder:text-slate-500 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 [color-scheme:dark]'
const NOTE_EDITOR_SURFACE_CLASS = 'flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/28'
const NOTE_EDITOR_TEXTAREA_CLASS = 'h-full w-full resize-none border-0 bg-transparent px-6 py-6 text-[15px] leading-8 text-slate-200 placeholder:text-slate-500 outline-none ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 md:px-8 md:py-8'
const NOTE_FOOTER_CLASS = 'flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/45 pt-4 text-xs text-slate-500'
const NOTE_PIN_BUTTON_CLASS = 'h-9 px-3 rounded-xl text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-slate-100'

function extractNoteMetadata(rawContent) {
  let remaining = rawContent ?? ''
  let folder = ''
  let pinned = false

  const markerPattern = /^\[\[(folder|pinned):([\s\S]*?)\]\]\n?/
  while (true) {
    const match = remaining.match(markerPattern)
    if (!match) break

    const key = match[1]
    const value = match[2]
    if (key === 'folder') folder = value.trim()
    if (key === 'pinned') pinned = value.trim().toLowerCase() === 'true'
    remaining = remaining.slice(match[0].length)
  }

  return {
    folder: folder || DEFAULT_FOLDER,
    pinned,
    content: remaining,
  }
}

function serializeNoteContent(content, folder, pinned) {
  const lines = []
  const trimmedFolder = (folder || '').trim()

  if (trimmedFolder && trimmedFolder !== DEFAULT_FOLDER) lines.push(`[[folder:${trimmedFolder}]]`)
  if (pinned) lines.push('[[pinned:true]]')
  if (content) lines.push(content)

  return lines.join('\n').trim()
}

function extractWikiLinks(text) {
  const matches = String(text || '').match(/\[\[([^\]]+)\]\]/g) || []
  return matches.map((match) => match.replace('[[', '').replace(']]', '').trim()).filter(Boolean)
}

function normalizeNote(note) {
  const metadata = extractNoteMetadata(note.content || '')
  return {
    ...note,
    content: metadata.content,
    folder: metadata.folder,
    pinned: metadata.pinned,
  }
}

function emptyDraft() {
  return {
    title: '',
    content: '',
    pinned: false,
  }
}

function withOrder(notes, orderIds) {
  const orderMap = new Map(orderIds.map((id, index) => [id, index]))
  return [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1

    const ai = orderMap.has(a.id) ? orderMap.get(a.id) : Number.MAX_SAFE_INTEGER
    const bi = orderMap.has(b.id) ? orderMap.get(b.id) : Number.MAX_SAFE_INTEGER
    if (ai !== bi) return ai - bi

    return new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
  })
}

function reorderIds(ids, fromId, toId) {
  const next = [...ids]
  const fromIndex = next.indexOf(fromId)
  const toIndex = next.indexOf(toId)
  if (fromIndex === -1 || toIndex === -1) return ids

  next.splice(fromIndex, 1)
  next.splice(toIndex, 0, fromId)
  return next
}

function formatSavedAgo(timestamp, now) {
  if (!timestamp) return 'just now'
  const diffMs = Math.max(0, now - timestamp)
  const diffSeconds = Math.floor(diffMs / 1000)
  if (diffSeconds < 10) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  const diffMinutes = Math.floor(diffSeconds / 60)
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  const diffHours = Math.floor(diffMinutes / 60)
  return `${diffHours}h ago`
}

export default function Notes() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes()
  const normalizedBase = useMemo(() => notes.map(normalizeNote), [notes])

  const [noteOrderIds, setNoteOrderIds] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(ORDER_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [draft, setDraft] = useState(() => {
    if (typeof window === 'undefined') return emptyDraft()
    try {
      const cached = window.localStorage.getItem(DRAFT_STORAGE_KEY)
      if (!cached) return emptyDraft()
      const parsed = JSON.parse(cached)
      return {
        ...emptyDraft(),
        title: String(parsed?.title || ''),
        content: String(parsed?.content || ''),
        pinned: Boolean(parsed?.pinned),
      }
    } catch {
      return emptyDraft()
    }
  })
  const [status, setStatus] = useState('')
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [statusNow, setStatusNow] = useState(() => Date.now())
  const [draggedId, setDraggedId] = useState(null)

  const textareaRef = useRef(null)
  const editorRef = useRef(null)
  const searchRef = useRef(null)
  const hydratingRef = useRef(false)

  const normalizedNotes = useMemo(() => withOrder(normalizedBase, noteOrderIds), [normalizedBase, noteOrderIds])

  const filteredNotes = useMemo(() => {
    return normalizedNotes.filter((note) => {
      const q = query.trim().toLowerCase()
      return !q || note.title?.toLowerCase().includes(q) || note.content?.toLowerCase().includes(q)
    })
  }, [normalizedNotes, query])

  const pinnedNotes = useMemo(() => filteredNotes.filter((note) => note.pinned), [filteredNotes])
  const regularNotes = useMemo(() => filteredNotes.filter((note) => !note.pinned), [filteredNotes])

  const selectedNote = useMemo(() => normalizedNotes.find((note) => note.id === selectedId) || null, [normalizedNotes, selectedId])

  const backlinks = useMemo(() => {
    if (!selectedNote?.title) return []
    const needle = selectedNote.title.trim().toLowerCase()
    if (!needle) return []

    return normalizedNotes.filter((note) => {
      if (note.id === selectedNote.id) return false
      const links = extractWikiLinks(note.content || '')
      return links.some((link) => link.toLowerCase() === needle)
    })
  }, [normalizedNotes, selectedNote])

  useEffect(() => {
    const allIds = normalizedBase.map((note) => note.id)
    if (!allIds.length) return

    setNoteOrderIds((prev) => {
      const existing = prev.filter((id) => allIds.includes(id))
      const missing = allIds.filter((id) => !existing.includes(id))
      return [...existing, ...missing]
    })
  }, [normalizedBase])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(noteOrderIds))
  }, [noteOrderIds])

  useEffect(() => {
    if (selectedId && !selectedNote) {
      setSelectedId(null)
    }
  }, [selectedId, selectedNote])

  useEffect(() => {
    if (!selectedId || !selectedNote) return
    hydratingRef.current = true
    setDraft({
      title: selectedNote.title || '',
      content: selectedNote.content || '',
      pinned: Boolean(selectedNote.pinned),
    })
    setStatus('')
    setLastSavedAt(selectedNote.updated_at ? new Date(selectedNote.updated_at).getTime() : null)

    const timer = setTimeout(() => {
      hydratingRef.current = false
    }, 0)
    return () => clearTimeout(timer)
  }, [selectedId, selectedNote])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStatusNow(Date.now())
    }, 15000)

    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (selectedId || typeof window === 'undefined') return
    window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      title: draft.title,
      content: draft.content,
      pinned: draft.pinned,
    }))
  }, [selectedId, draft.title, draft.content, draft.pinned])

  const focusEditor = () => {
    requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      textareaRef.current?.focus()
    })
  }

  const saveExistingNote = async () => {
    if (!selectedId) return
    setStatus('Saving...')
    const preservedFolder = selectedNote?.folder || DEFAULT_FOLDER
    const payload = {
      title: draft.title.trim() || 'Untitled',
      content: serializeNoteContent(draft.content, preservedFolder, draft.pinned),
    }
    const result = await updateNote(selectedId, payload)
    if (result?.error) {
      setStatus('Save failed')
      return
    }
    setStatus('Saved')
    setLastSavedAt(Date.now())
  }

  useEffect(() => {
    if (!selectedId || hydratingRef.current) return

    const timer = setTimeout(async () => {
      await saveExistingNote()
    }, AUTOSAVE_DELAY)

    return () => clearTimeout(timer)
  }, [selectedId, selectedNote?.folder, draft.title, draft.content, draft.pinned])

  const createNewDraft = () => {
    setSelectedId(null)
    setDraft(emptyDraft())
    setStatus('Draft')
    focusEditor()
  }

  const saveNewNote = async () => {
    const payload = {
      title: draft.title.trim() || 'Untitled',
      content: serializeNoteContent(draft.content, DEFAULT_FOLDER, draft.pinned),
    }

    setStatus('Saving...')
    const result = await addNote(payload)
    if (result?.error || !result?.data?.id) {
      setStatus('Save failed')
      return
    }

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY)
    }

    setSelectedId(result.data.id)
    setStatus('Saved')
    setLastSavedAt(Date.now())
  }

  const saveCurrentNote = async () => {
    if (selectedId) {
      await saveExistingNote()
      return
    }
    await saveNewNote()
  }

  const togglePin = async (note) => {
    const nextPinned = !note.pinned
    await updateNote(note.id, {
      title: note.title,
      content: serializeNoteContent(note.content, note.folder || DEFAULT_FOLDER, nextPinned),
    })

    if (selectedId === note.id) {
      setDraft((prev) => ({ ...prev, pinned: nextPinned }))
    }
  }

  const handleDropOnCard = (targetId) => {
    if (!draggedId || draggedId === targetId) return
    setNoteOrderIds((prev) => reorderIds(prev, draggedId, targetId))
    setDraggedId(null)
  }

  useEffect(() => {
    const onKeyDown = async (event) => {
      const key = event.key.toLowerCase()
      if (!(event.ctrlKey || event.metaKey)) return

      if (key === 'n') {
        event.preventDefault()
        createNewDraft()
      }

      if (key === 's') {
        event.preventDefault()
        await saveCurrentNote()
      }

      if (key === 'k') {
        event.preventDefault()
        searchRef.current?.focus()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  const autosaveText = (() => {
    if (status === 'Saving...') return 'Saving...'
    if (status === 'Save failed') return 'Autosave failed'
    if (status === 'Saved') return `Autosaved \u2022 ${formatSavedAgo(lastSavedAt, statusNow)}`
    if (!selectedId) return ''
    return 'Autosaved \u2022 just now'
  })()

  const renderNoteCard = (note) => (
    <div
      key={note.id}
      draggable
      onDragStart={() => setDraggedId(note.id)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => handleDropOnCard(note.id)}
      className={`group relative w-full rounded-2xl border border-l-[3px] px-3 py-2.5 transition-all cursor-pointer ${selectedId === note.id ? 'border-slate-700/80 border-l-cyan-400 bg-cyan-500/8 shadow-[0_10px_28px_rgba(8,145,178,0.08)]' : 'border-slate-800/70 border-l-transparent bg-slate-950/45 hover:bg-slate-900/70 hover:brightness-110 hover:shadow-[0_10px_24px_rgba(2,6,23,0.22)]'}`}
      onClick={() => setSelectedId(note.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="inline-flex items-center gap-2 min-w-0">
          <GripVertical size={13} className="text-slate-600 shrink-0" />
          <p className="text-[15px] font-bold text-slate-100 line-clamp-1">{note.title}</p>
          {note.pinned && (
            <span className="shrink-0 rounded-full bg-amber-500/12 px-1.5 py-0.5 text-[10px] font-medium text-amber-200">
              {'\u{1F4CC}'}
            </span>
          )}
        </div>
        <button
          onClick={(event) => {
            event.stopPropagation()
            togglePin(note)
          }}
          className={`shrink-0 rounded-full p-1 transition-colors ${note.pinned ? 'text-amber-300 bg-amber-500/10' : 'text-slate-500 hover:text-amber-300 group-hover:text-slate-300'}`}
          title={note.pinned ? 'Unpin note' : 'Pin note'}
        >
          {note.pinned ? <PinOff size={13} /> : <Pin size={13} />}
        </button>
      </div>

      <p className="mt-1 text-xs leading-5 text-slate-500 line-clamp-1">
        {(note.content || 'Empty note').replace(/\s+/g, ' ')} <span className="mx-1 text-slate-700">{'\u2022'}</span> {relativeTime(note.updated_at || note.created_at)}
      </p>
    </div>
  )

  return (
    <div className="p-6 md:p-8 space-y-6 h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Notes</h1>
          <p className="text-sm text-slate-500 mt-1">Focused markdown notes workspace with search, pinning, shortcuts, backlinks, and autosave.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={createNewDraft}>New Note</Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-8 items-stretch">
        <Card className="h-[calc(100vh-220px)] min-h-[560px] overflow-hidden">
          <CardContent className="p-4 h-full flex flex-col gap-4">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                ref={searchRef}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes and content..."
                className="w-full rounded-xl border border-slate-700/60 bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : normalizedNotes.length === 0 ? (
                <div className="h-full rounded-xl border border-slate-800/70 bg-slate-950/45 grid place-items-center text-center px-6">
                  <div>
                    <p className="text-sm font-medium text-slate-300">No notes yet</p>
                    <p className="text-xs text-slate-500 mt-1">Create your first note and start capturing ideas.</p>
                  </div>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="h-full rounded-xl border border-slate-800/70 bg-slate-950/45 grid place-items-center text-center px-6">
                  <p className="text-sm text-slate-500">No notes match your search.</p>
                </div>
              ) : (
                <>
                  {pinnedNotes.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-amber-300/80 mb-2">Pinned</p>
                      <div className="space-y-2">
                        {pinnedNotes.map(renderNoteCard)}
                      </div>
                    </div>
                  )}

                  {regularNotes.length > 0 && (
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-slate-500 mb-2">All Notes</p>
                      <div className="space-y-2">
                        {regularNotes.map(renderNoteCard)}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div ref={editorRef} className="xl:border-l xl:border-slate-800/45 xl:pl-8">
          <Card className="h-[calc(100vh-220px)] min-h-[560px] overflow-hidden border-slate-700/50 bg-slate-900/50">
            <CardContent className="p-5 md:p-6 h-full">
              <div className="max-w-[900px] w-full mx-auto h-full flex flex-col gap-4">
                <div className={`${NOTE_TITLE_FIELD_CLASS} ${NOTE_TITLE_FOCUS_CLASS}`}>
                  <input
                    value={draft.title}
                    onChange={(event) => setDraft((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Untitled"
                    className={NOTE_TITLE_INPUT_CLASS}
                  />
                </div>

                <div className={NOTE_EDITOR_SURFACE_CLASS}>
                  <textarea
                    ref={textareaRef}
                    value={draft.content}
                    onChange={(event) => setDraft((prev) => ({ ...prev, content: event.target.value }))}
                    placeholder="Start writing your note..."
                    className={NOTE_EDITOR_TEXTAREA_CLASS}
                  />
                </div>

                {selectedNote && backlinks.length > 0 && (
                  <div className="rounded-xl border border-slate-800/70 bg-slate-950/55 p-3">
                    <p className="text-xs font-semibold text-slate-300 inline-flex items-center gap-1.5 mb-2">
                      <Link2 size={12} />
                      Backlinks
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {backlinks.map((note) => (
                        <button
                          key={note.id}
                          onClick={() => setSelectedId(note.id)}
                          className="px-2.5 py-1 rounded-lg text-xs border border-slate-700/70 text-slate-300 hover:bg-slate-800/70"
                        >
                          {note.title}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={NOTE_FOOTER_CLASS}>
                  <div className="inline-flex items-center gap-2">
                    <span className={`h-1.5 w-1.5 rounded-full ${status === 'Saved' ? 'bg-emerald-400' : status === 'Saving...' ? 'bg-cyan-400 animate-pulse' : status === 'Save failed' ? 'bg-rose-400' : 'bg-slate-500'}`} />
                    <span>{autosaveText}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDraft((prev) => ({ ...prev, pinned: !prev.pinned }))}
                      className={`${NOTE_PIN_BUTTON_CLASS} ${draft.pinned ? 'text-amber-200' : ''}`}
                    >
                      {draft.pinned ? '\u{1F4CC} Pinned' : '\u{1F4CC} Pin note'}
                    </button>

                    {selectedId && (
                      <button
                        onClick={() => setDeleteId(selectedId)}
                        className="h-9 px-3 rounded-xl text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Trash2 size={13} />
                          Delete
                        </span>
                      </button>
                    )}

                    <Button size="sm" leftIcon={<Save size={14} />} onClick={saveCurrentNote}>Save</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete Note" size="sm">
        <p className="text-sm text-slate-400 mb-6">This note will be permanently deleted.</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={async () => {
              const id = deleteId
              await deleteNote(id)
              setDeleteId(null)
              if (selectedId === id) {
                setSelectedId(null)
                setDraft(emptyDraft())
                setStatus('Draft')
              }
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  )
}
