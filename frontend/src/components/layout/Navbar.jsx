import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Menu,
  CheckCheck,
} from 'lucide-react'
import { cn, relativeTime } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'

const toneClasses = {
  emerald: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
  rose: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  amber: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  indigo: 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
}

export default function Navbar({ onMenuToggle }) {
  const { user, profile, signOut } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const navigate = useNavigate()
  const notificationsRef = useRef(null)
  const profileRef = useRef(null)

  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const initials = displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const closeMenus = () => {
    setProfileOpen(false)
    setNotificationsOpen(false)
  }

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target
      if (!(target instanceof Node)) return

      if (notificationsRef.current?.contains(target) || profileRef.current?.contains(target)) {
        return
      }

      closeMenus()
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [])

  return (
    <header className="relative h-16 flex items-center gap-4 px-6 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-20">
      <button
        onClick={onMenuToggle}
        data-sidebar-toggle="true"
        className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
      >
        <Menu size={18} />
      </button>

      <div className="ml-auto flex items-center gap-2">
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => {
              setNotificationsOpen((value) => !value)
              setProfileOpen(false)
            }}
            className={cn(
              'relative flex h-10 w-10 items-center justify-center rounded-2xl border transition-all focus:outline-none focus-visible:outline-none focus-visible:ring-0',
              notificationsOpen
                ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.18)]'
                : 'border-slate-800/70 bg-slate-900/55 text-slate-300 hover:border-slate-700/80 hover:bg-slate-900/80 hover:text-white'
            )}
            aria-label="Open notifications"
          >
            <Bell size={16} className="drop-shadow-[0_0_10px_rgba(129,140,248,0.15)]" />
            {unreadCount > 0 && (
              <span className="absolute left-[60%] top-[-0.28rem] flex min-w-[1.15rem] h-[1.15rem] items-center justify-center rounded-full border border-slate-950/90 bg-indigo-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_14px_rgba(99,102,241,0.85)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-full z-20 mt-3 w-[400px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border border-slate-800/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.98))] shadow-[0_24px_60px_-34px_rgba(2,6,23,0.88)]">
              <div className="border-b border-slate-800/70 px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-slate-100">Notifications</p>
                    <p className="mt-1 text-xs font-medium text-indigo-300">
                      {unreadCount} unread
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700/70 bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                  >
                    <CheckCheck size={12} />
                    Mark all as read
                  </button>
                </div>
              </div>

              <div className="max-h-[480px] overflow-y-auto p-2">
                {notifications.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell size={18} className="mx-auto text-slate-600" />
                    <p className="mt-3 text-sm font-medium text-slate-300">Nothing new right now</p>
                    <p className="mt-1 text-xs text-slate-500">New study activity, goal updates, streak reminders, and achievements will show up here.</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          markAsRead(item.id)
                          navigate(item.route)
                          setNotificationsOpen(false)
                        }}
                        className={cn(
                          'group relative flex w-full items-start gap-3 rounded-xl px-3.5 py-3 text-left transition-all focus:outline-none focus-visible:outline-none focus-visible:ring-0',
                          item.unread
                            ? 'bg-indigo-500/[0.06] hover:bg-indigo-500/[0.1]'
                            : 'hover:bg-white/[0.04]'
                        )}
                      >
                        <div className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border', toneClasses[item.tone] ?? toneClasses.indigo)}>
                          <Icon size={15} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className={cn('truncate text-sm font-semibold', item.unread ? 'text-slate-100' : 'text-slate-300')}>
                                  {item.title}
                                </p>
                                {item.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.95)]" />}
                              </div>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p>
                            </div>
                            <span className="shrink-0 text-[11px] whitespace-nowrap text-slate-500">
                              {relativeTime(item.when)}
                            </span>
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div ref={profileRef} className="relative">
          <button
            onClick={() => {
              setProfileOpen((value) => !value)
              setNotificationsOpen(false)
            }}
            className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl hover:bg-white/[0.06] transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-300">{displayName.split(' ')[0]}</span>
            <ChevronDown size={14} className={cn('text-slate-500 transition-transform', profileOpen && 'rotate-180')} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-700/60 bg-slate-900/95 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] z-20 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-800/60">
                <p className="text-sm font-semibold text-slate-200">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              {[
                { icon: User, label: 'Profile', action: () => { navigate('/app/settings'); setProfileOpen(false) } },
                { icon: Settings, label: 'Settings', action: () => { navigate('/app/settings'); setProfileOpen(false) } },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.05] transition-all"
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
              <div className="border-t border-slate-800/60 mt-1 pt-1">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.06] transition-all"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent" />
        <div className="shell-divider-glow-x absolute left-0 right-0 top-0 h-20 bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent blur-lg" />
      </div>
    </header>
  )
}
