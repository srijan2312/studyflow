import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, BookOpen, Target, BarChart3, BookCheck, Trophy, Crosshair,
  Calendar, FileText, Bookmark, Settings, LogOut, CircleHelp, CalendarCheck,
  ChevronLeft, GraduationCap, X
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/app' },
  { icon: BookOpen, label: 'Study Tracker', to: '/app/tracker' },
  { icon: Target, label: 'Goals', to: '/app/goals' },
  { icon: Crosshair, label: 'Daily Challenges', to: '/app/challenges' },
  { icon: BookCheck, label: 'Topic Mastery', to: '/app/mastery' },
  { icon: BarChart3, label: 'Analytics', to: '/app/analytics' },
  { icon: Trophy, label: 'Achievements', to: '/app/achievements' },
  { icon: Calendar, label: 'Calendar', to: '/app/calendar' },
  { icon: CalendarCheck, label: 'Habits', to: '/app/habits' },
  { icon: FileText, label: 'Notes', to: '/app/notes' },
  { icon: Bookmark, label: 'Resources', to: '/app/resources' },
  { icon: CircleHelp, label: 'FAQ', to: '/app/faq' },
]

export default function Sidebar({ collapsed, onCollapse, isMobile = false, onNavigate: handleNavigateAway }) {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    handleNavigateAway?.()
    navigate('/')
  }

  const avatarUrl = profile?.avatar_url
  const displayName = profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <aside
      className={cn(
        'relative h-full flex flex-col',
        'bg-slate-950/90 backdrop-blur-2xl',
        'transition-all duration-300 ease-in-out',
        isMobile ? 'w-[240px] shadow-[0_24px_80px_rgba(0,0,0,0.45)]' : collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {!isMobile && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-px overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/35 to-transparent" />
          <div className="shell-divider-glow-y absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-indigo-500/55 via-purple-500/35 to-transparent blur-lg" />
        </div>
      )}

      <div className={cn(
        'relative flex items-center h-16 px-4',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-glow-sm">
          <GraduationCap size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-[0.9375rem] font-bold gradient-text">StudyFlow</span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />
          <div className="shell-divider-glow-x absolute left-0 right-0 top-0 h-20 bg-gradient-to-r from-transparent via-indigo-500/35 to-transparent blur-lg" />
        </div>
      </div>

      <button
        onClick={onCollapse}
        className={cn(
          'absolute flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all z-10',
          isMobile
            ? 'right-3 top-5 w-8 h-8 rounded-xl bg-slate-900/80 border border-slate-700/60 hover:bg-slate-800'
            : 'bg-slate-800 border border-slate-700/60 -right-3 top-20 w-6 h-6 rounded-full hover:scale-110'
        )}
        aria-label={isMobile ? 'Close sidebar' : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isMobile ? (
          <X size={14} />
        ) : (
          <ChevronLeft size={12} className={cn('transition-transform', collapsed && 'rotate-180')} />
        )}
      </button>

      <nav className="flex-1 overflow-y-auto no-scrollbar py-3 px-2 space-y-0.5">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            onClick={() => handleNavigateAway?.()}
            className={({ isActive }) => cn(
              'relative overflow-hidden flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium',
              'transition-all duration-200 group select-none cursor-pointer',
              collapsed && 'justify-center',
              isActive
                ? 'text-indigo-300 bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent shadow-[0_0_22px_rgba(99,102,241,0.2)]'
                : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]'
            )}
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-r-full transition-all duration-200',
                    isActive
                      ? 'h-8 bg-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.95)]'
                      : 'group-hover:h-6 group-hover:bg-indigo-400/60 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.45)]'
                  )}
                />
                <span
                  className={cn(
                    'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200',
                    isActive
                      ? 'opacity-100 bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-transparent'
                      : 'group-hover:opacity-100 bg-gradient-to-r from-slate-700/30 to-transparent'
                  )}
                />
                <Icon
                  size={17}
                  className={cn(
                    'relative z-[1] shrink-0 transition-all duration-200',
                    isActive
                      ? 'text-indigo-300 drop-shadow-[0_0_10px_rgba(129,140,248,0.75)]'
                      : 'group-hover:text-indigo-300 group-hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.55)]'
                  )}
                />
                {!collapsed && <span className="relative z-[1]">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 pb-3 space-y-0.5 border-t border-slate-800/60 pt-3">
        <NavLink
          to="/app/settings"
          onClick={() => handleNavigateAway?.()}
          className={({ isActive }) => cn(
            'relative overflow-hidden flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium',
            'transition-all duration-200 group',
            collapsed && 'justify-center',
            isActive
              ? 'text-indigo-300 bg-gradient-to-r from-indigo-500/15 via-indigo-500/10 to-transparent shadow-[0_0_22px_rgba(99,102,241,0.2)]'
              : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 hover:shadow-[0_0_16px_rgba(99,102,241,0.12)]'
          )}
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-0 rounded-r-full transition-all duration-200',
                  isActive
                    ? 'h-8 bg-indigo-400 shadow-[0_0_14px_rgba(129,140,248,0.95)]'
                    : 'group-hover:h-6 group-hover:bg-indigo-400/60 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.45)]'
                )}
              />
              <span
                className={cn(
                  'absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200',
                  isActive
                    ? 'opacity-100 bg-gradient-to-r from-indigo-500/10 via-indigo-400/5 to-transparent'
                    : 'group-hover:opacity-100 bg-gradient-to-r from-slate-700/30 to-transparent'
                )}
              />
              <Settings
                size={17}
                className={cn(
                  'relative z-[1] shrink-0 transition-all duration-200',
                  isActive
                    ? 'text-indigo-300 drop-shadow-[0_0_10px_rgba(129,140,248,0.75)]'
                    : 'group-hover:text-indigo-300 group-hover:drop-shadow-[0_0_8px_rgba(129,140,248,0.55)]'
                )}
              />
              {!collapsed && <span className="relative z-[1]">Settings</span>}
            </>
          )}
        </NavLink>

        <button
          onClick={handleSignOut}
          className={cn(
            'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-sm font-medium',
            'text-slate-500 hover:text-red-400 hover:bg-red-500/[0.06]',
            'transition-all duration-150',
            collapsed && 'justify-center'
          )}
        >
          <LogOut size={17} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {!collapsed && (
          <div className="mt-2 flex items-center gap-3 px-2.5 py-2.5 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{displayName}</p>
              <p className="text-[10px] text-slate-600 truncate">{user?.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
