import { useEffect, useMemo, useRef, useState } from 'react'
import {
  User,
  Lock,
  Bell,
  Download,
  Trash2,
  Camera,
  Check,
  AlertTriangle,
  Palette,
  History,
  Mail,
  Database,
  ShieldCheck,
  Clock3,
} from 'lucide-react'
import Card, { CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input, { Select } from '../../components/ui/Input'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { useAuth } from '../../context/AuthContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useNotes } from '../../hooks/useNotes'
import { useResources } from '../../hooks/useResources'
import { getSessionDuration } from '../../lib/utils'
import { supabase } from '../../lib/supabase'
import {
  ACCENT_OPTIONS,
  applyPreferences,
  clearActivityLog,
  logAccountActivity,
  readActivityLog,
  readPreferences,
  updatePreferences,
} from '../../lib/preferences'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data & Backup', icon: Download },
  { id: 'activity', label: 'Activity', icon: History },
]

const WEEKLY_REPORT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-5">
      <div className="pr-4">
        <p className="text-sm font-medium text-slate-200">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? 'bg-[var(--accent-solid)]' : 'bg-slate-700'}`}
      >
        <span className={`absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )
}

function AvatarSection({ profile, onUpload }) {
  const inputRef = useRef()
  const [imgFailed, setImgFailed] = useState(false)
  const initials = profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??'
  const showImage = Boolean(profile?.avatar_url) && !imgFailed

  return (
    <div className="flex items-center gap-5">
      <div className="relative group">
        {showImage ? (
          <img
            src={profile.avatar_url}
            alt="avatar"
            onError={() => setImgFailed(true)}
            className="h-20 w-20 rounded-2xl object-cover ring-2 ring-[var(--accent-border-strong)]"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--accent-solid),var(--accent-strong))] text-2xl font-bold text-white ring-2 ring-[var(--accent-border)]">
            {initials}
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Camera size={18} className="text-white" />
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => onUpload(e.target.files[0])} />
      </div>
      <div>
        <p className="font-semibold text-slate-200">{profile?.full_name || 'Unknown'}</p>
        <p className="text-sm text-slate-500">{profile?.email || ''}</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-1.5 text-xs text-[var(--accent-solid)] transition-colors hover:opacity-80">
          Change photo
        </button>
      </div>
    </div>
  )
}

function ProfileTab() {
  const { user, profile, updateProfile } = useAuth()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    username: profile?.username || '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || '',
      username: profile?.username || '',
    })
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    await updateProfile(form)
    setSaving(false)
    setSaved(true)
    logAccountActivity('Profile updated', 'Updated display name or username')
    setTimeout(() => setSaved(false), 2500)
  }

  const handleAvatarUpload = async (file) => {
    if (!file || !user) return
    setAvatarError('')

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please select a valid image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be 5MB or smaller.')
      return
    }

    setUploadingAvatar(true)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const filePath = `${user.id}/avatar.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, cacheControl: '3600' })

      if (uploadError) {
        const message = uploadError.message || 'Failed to upload avatar.'
        setAvatarError(message.toLowerCase().includes('bucket') ? 'Storage bucket "avatars" was not found. Create it in Supabase Storage first.' : message)
        return
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const { error: profileError } = await updateProfile({ avatar_url: `${data.publicUrl}?t=${Date.now()}` })
      if (profileError) {
        setAvatarError(profileError.message || 'Avatar uploaded, but failed to save profile.')
        return
      }
      logAccountActivity('Avatar updated', `Uploaded a new profile image for ${profile?.email || user.email}`)
    } catch {
      setAvatarError('Unexpected error while uploading avatar.')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>Your avatar visible to you on the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarSection profile={profile} onUpload={handleAvatarUpload} />
          {uploadingAvatar && <p className="mt-3 text-xs text-[var(--accent-solid)]">Uploading avatar...</p>}
          {avatarError && <p className="mt-3 text-xs text-red-400">{avatarError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your display name and username</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Full Name" value={form.full_name} onChange={set('full_name')} placeholder="Your display name" />
          <Input label="Username" value={form.username} onChange={set('username')} placeholder="@username" />
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500">Email address</label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800/60 bg-slate-900/40 px-3.5 py-2.5 text-sm text-slate-600">
              {profile?.email}
              <Badge variant="emerald" className="ml-auto text-[10px]">Verified</Badge>
            </div>
            <p className="mt-1.5 text-xs text-slate-600">Email changes require re-verification via Supabase Auth.</p>
          </div>
          <div className="pt-1">
            <Button onClick={handleSave} loading={saving} leftIcon={saved ? <Check size={14} /> : undefined} variant={saved ? 'success' : 'primary'}>
              {saved ? 'Saved!' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AppearanceTab({ preferences, onUpdate }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Accent Color</CardTitle>
          <CardDescription>Change the focus color used across buttons, fields, and highlights</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {ACCENT_OPTIONS.map((accent) => {
            const active = preferences.accent === accent.id
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => onUpdate((current) => ({ ...current, accent: accent.id }))}
                className={`rounded-2xl border p-4 text-left transition-all ${active ? 'border-[var(--accent-border-strong)] bg-[var(--accent-soft-bg)]' : 'border-slate-800/70 bg-slate-900/35 hover:border-slate-700/70'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="h-4 w-4 rounded-full" style={{ backgroundColor: accent.hex }} />
                  <span className="text-sm font-medium text-slate-200">{accent.label}</span>
                </div>
              </button>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function SecurityTab() {
  const { user } = useAuth()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.')
      return
    }

    setSaving(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: form.password })
      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      logAccountActivity('Password changed', 'Updated account password from Settings')
      setSuccess(true)
      setForm({ password: '', confirm: '' })
    } catch {
      setError('Failed to update password.')
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="New Password" type="password" value={form.password} onChange={set('password')} placeholder="Min. 8 characters" />
            <Input label="Confirm New Password" type="password" value={form.confirm} onChange={set('confirm')} placeholder="Re-enter password" />
            {error && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                <AlertTriangle size={14} /> {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400">
                <Check size={14} /> Password updated successfully.
              </div>
            )}
            <Button type="submit" loading={saving}>Update password</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Basic account and verification details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/60 py-3">
            <div>
              <p className="text-sm font-medium text-slate-300">Email</p>
              <p className="text-xs text-slate-600">{user?.email}</p>
            </div>
            <Badge variant="emerald">Verified</Badge>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium text-slate-300">Account created</p>
              <p className="text-xs text-slate-600">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="text-emerald-400" />
              Secure account
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationsTab({ preferences, onUpdate, email }) {
  const prefs = preferences.notifications
  const toggle = (key) => onUpdate((current) => ({
    ...current,
    notifications: {
      ...current.notifications,
      [key]: !current.notifications[key],
    },
  }))

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Choose what updates you receive in-app</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-800/60">
          <Toggle checked={prefs.dailyReminder} onChange={() => toggle('dailyReminder')} label="Daily study reminder" description="Get reminded to log your study sessions each day" />
          <Toggle checked={prefs.weeklyDigest} onChange={() => toggle('weeklyDigest')} label="Weekly progress digest" description="A summary of your week delivered every Monday" />
          <Toggle checked={prefs.goalDeadlines} onChange={() => toggle('goalDeadlines')} label="Goal deadline alerts" description="Notify 3 days before a goal deadline" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Report Email</CardTitle>
          <CardDescription>Receive a weekly recap by email instead of only seeing it in-app</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            checked={prefs.weeklyReportEmail}
            onChange={() => toggle('weeklyReportEmail')}
            label="Email weekly report"
            description={`Send the report to ${email || 'your verified email address'}`}
          />
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/35 p-4">
              <div className="flex items-center gap-2">
                <Mail size={15} className="text-[var(--accent-solid)]" />
                <p className="text-sm font-medium text-slate-200">Delivery address</p>
              </div>
              <p className="mt-2 text-sm text-slate-400">{email || 'No email on file'}</p>
            </div>
            <Select
              label="Send on"
              value={prefs.weeklyReportDay}
              onChange={(event) => onUpdate((current) => ({
                ...current,
                notifications: {
                  ...current.notifications,
                  weeklyReportDay: event.target.value,
                },
              }))}
            >
              {WEEKLY_REPORT_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function DataTab({ preferences, onUpdate }) {
  const { user } = useAuth()
  const { sessions } = useStudySessions()
  const { goals } = useGoals()
  const { notes } = useNotes()
  const { resources } = useResources()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const exportCSV = () => {
    const header = ['Date', 'Topic', 'Subject', 'Duration (min)', 'Difficulty', 'Notes']
    const rows = sessions.map((session) => [
      new Date(session.created_at || session.start_time).toLocaleDateString(),
      session.topic || '',
      session.subject || '',
      getSessionDuration(session),
      session.difficulty || '',
      (session.notes || '').replace(/,/g, ';'),
    ])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `studyflow-sessions-${new Date().toISOString().split('T')[0]}.csv`
    anchor.click()
    URL.revokeObjectURL(url)
    logAccountActivity('CSV export created', `Exported ${sessions.length} study sessions`)
  }

  const exportBackup = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      account: {
        email: user?.email || '',
      },
      preferences,
      sessions,
      goals,
      notes,
      resources,
    }
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `studyflow-backup-${new Date().toISOString().split('T')[0]}.json`
    anchor.click()
    URL.revokeObjectURL(url)

    onUpdate((current) => ({
      ...current,
      backup: {
        ...current.backup,
        lastCreatedAt: new Date().toISOString(),
      },
    }))
    logAccountActivity('Backup created', `Created JSON backup with ${sessions.length} sessions, ${goals.length} goals, ${notes.length} notes, and ${resources.length} resources`)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Backup</CardTitle>
          <CardDescription>Create a full JSON backup of your study data and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Sessions', value: sessions.length },
              { label: 'Goals', value: goals.length },
              { label: 'Notes', value: notes.length },
              { label: 'Resources', value: resources.length },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-800/60 bg-slate-900/35 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-slate-100">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/35 p-4">
            <p className="text-sm font-medium text-slate-300">Last backup</p>
            <p className="mt-1 text-xs text-slate-500">
              {preferences.backup.lastCreatedAt ? new Date(preferences.backup.lastCreatedAt).toLocaleString() : 'No backup created yet'}
            </p>
          </div>
          <Button onClick={exportBackup} leftIcon={<Database size={15} />}>Create backup</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your study sessions as a CSV file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-700/40 bg-slate-800/40 p-4">
            <p className="text-sm font-medium text-slate-300">Study Sessions CSV</p>
            <p className="mt-1 text-xs text-slate-500">
              {sessions.length} sessions, including topic, subject, duration, difficulty, and notes
            </p>
          </div>
          <Button onClick={exportCSV} leftIcon={<Download size={15} />} variant="secondary" disabled={sessions.length === 0}>
            Download CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions, proceed with caution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-medium text-slate-200">Delete account</p>
              <p className="mt-0.5 text-xs text-slate-500">Permanently delete your account and all study data. Cannot be undone.</p>
            </div>
            <Button variant="danger" onClick={() => setDeleteOpen(true)} className="shrink-0">Delete account</Button>
          </div>
        </CardContent>
      </Card>

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-400" />
            <p className="text-sm text-red-300">All your study sessions, goals, skills, notes, and resources will be permanently erased.</p>
          </div>
          <p className="text-sm text-slate-400">This action is irreversible. Are you absolutely sure?</p>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button
  variant="danger"
  className="flex-1"
  disabled={deleting}
  onClick={async () => {
    try {
      setDeleting(true)

      const { data: { session } } = await supabase.auth.getSession()

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/delete-account`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        }
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete account")
      }

      await supabase.auth.signOut()

      sessionStorage.setItem("accountDeleted", "true")

      window.location.href = "/"

    } catch (err) {
      console.error(err)
      alert("Failed to delete account")
      setDeleting(false)
    }
  }}
>
  {deleting ? "Deleting account..." : "Yes, delete my account"}
</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ActivityTab({ profileEmail }) {
  const [entries, setEntries] = useState(() => readActivityLog())

  const refreshEntries = () => setEntries(readActivityLog())

  useEffect(() => {
    refreshEntries()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Account Activity Log</CardTitle>
          <CardDescription>Recent settings, exports, and security actions for {profileEmail || 'this account'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/35 p-4">
            <div>
              <p className="text-sm font-medium text-slate-200">Tracked locally</p>
              <p className="mt-1 text-xs text-slate-500">This log keeps the latest account actions on this device.</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                clearActivityLog()
                refreshEntries()
              }}
            >
              Clear log
            </Button>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/35 p-5 text-sm text-slate-500">
              No recent account activity on this device yet.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/35 p-4">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/70 text-[var(--accent-solid)]">
                    <Clock3 size={15} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200">{entry.action}</p>
                    <p className="mt-1 text-xs text-slate-500">{entry.detail}</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-slate-600">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function Settings() {
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [preferences, setPreferences] = useState(() => readPreferences())

  useEffect(() => {
    applyPreferences(preferences)
    updatePreferences(preferences)
  }, [preferences])

  const updatePrefs = (updater, activityLabel, activityDetail) => {
    setPreferences((current) => {
      const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater }
      return next
    })
    if (activityLabel) logAccountActivity(activityLabel, activityDetail)
  }

  const TabComponent = useMemo(() => ({
    profile: <ProfileTab />,
    appearance: <AppearanceTab preferences={preferences} onUpdate={(updater) => updatePrefs(updater, 'Appearance updated', 'Changed theme or accent settings')} />,
    security: <SecurityTab />,
    notifications: <NotificationsTab preferences={preferences} onUpdate={(updater) => updatePrefs(updater, 'Notifications updated', 'Changed notification or weekly email preferences')} email={profile?.email} />,
    data: <DataTab preferences={preferences} onUpdate={(updater) => updatePrefs(updater)} />,
    activity: <ActivityTab profileEmail={profile?.email} />,
  }), [preferences, profile?.email])

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your account, appearance, backups, and notification preferences</p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-800/60 bg-slate-900/60 p-1 w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id ? 'bg-[var(--accent-soft-bg)] text-[var(--accent-solid)] shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {TabComponent[activeTab]}
    </div>
  )
}
