import { useEffect, useRef, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Trophy, BookOpen, Flame, Target, Clock, Crown, Moon, CalendarCheck, Library } from 'lucide-react'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import { cn } from '../../lib/utils'
import { useAchievementUnlocker } from '../../hooks/useAchievementUnlocker'
import { applyPreferences, readPreferences } from '../../lib/preferences'

const DESKTOP_BREAKPOINT = '(min-width: 1024px)'
const POPUP_LIFETIME_MS = 3000
const POPUP_FADE_MS = 420
const POPUP_QUEUE_DELAY_MS = 450

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

export default function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarHoverOpen, setSidebarHoverOpen] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const desktopSidebarRef = useRef(null)
  const mobileSidebarRef = useRef(null)
  const { notifications, dismissNotification } = useAchievementUnlocker()
  const [isPopupExiting, setIsPopupExiting] = useState(false)
  const [popupQueuePaused, setPopupQueuePaused] = useState(false)
  const closeMobileSidebar = () => setMobileSidebarOpen(false)
  const desktopSidebarExpanded = !sidebarCollapsed || sidebarHoverOpen
  const activeNotification = popupQueuePaused ? null : notifications[0] ?? null

  useEffect(() => {
    if (!activeNotification) {
      setIsPopupExiting(false)
      return
    }

    setIsPopupExiting(false)

    const fadeTimer = setTimeout(() => {
      setIsPopupExiting(true)
    }, Math.max(0, POPUP_LIFETIME_MS - POPUP_FADE_MS))

    const dismissTimer = setTimeout(() => {
      dismissNotification(activeNotification.id)
      setIsPopupExiting(false)
      setPopupQueuePaused(true)
    }, POPUP_LIFETIME_MS)

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(dismissTimer)
    }
  }, [activeNotification, dismissNotification])

  useEffect(() => {
    if (!popupQueuePaused) return

    const resumeTimer = setTimeout(() => {
      setPopupQueuePaused(false)
    }, POPUP_QUEUE_DELAY_MS)

    return () => {
      clearTimeout(resumeTimer)
    }
  }, [popupQueuePaused])

  useEffect(() => {
    applyPreferences(readPreferences())
  }, [])

  useEffect(() => {
    const handleDesktopOutsideInteraction = (event) => {
      const target = event.target
      const isDesktopViewport = window.matchMedia(DESKTOP_BREAKPOINT).matches

      if (!(target instanceof Element)) return
      if (target.closest('[data-sidebar-toggle="true"]')) return

      if (isDesktopViewport && !sidebarCollapsed && desktopSidebarRef.current && !desktopSidebarRef.current.contains(target)) {
        setSidebarCollapsed(true)
        setSidebarHoverOpen(false)
      }
    }

    document.addEventListener('pointerdown', handleDesktopOutsideInteraction, true)
    return () => {
      document.removeEventListener('pointerdown', handleDesktopOutsideInteraction, true)
    }
  }, [sidebarCollapsed])

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Achievement unlock modal */}
      {activeNotification && (
        <div
          className={cn(
            'fixed inset-0 z-[80] flex items-center justify-center p-4 transition-opacity duration-300',
            isPopupExiting ? 'opacity-0' : 'opacity-100'
          )}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className={cn(
            'relative w-full max-w-md overflow-hidden rounded-2xl border border-emerald-500/40',
            'bg-gradient-to-b from-slate-900 to-slate-950 px-6 py-7 text-center',
            'shadow-[0_24px_70px_rgba(16,185,129,0.3)]',
            isPopupExiting ? 'animate-[popupFadeOut_0.42s_ease-in_forwards]' : 'animate-[popupIn_0.45s_cubic-bezier(0.2,0.9,0.2,1)_both]'
          )}>
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 16 }).map((_, idx) => (
                <span
                  key={idx}
                  className="absolute top-1/2 left-1/2 h-2 w-1.5 rounded-full opacity-80"
                  style={{
                    backgroundColor: idx % 3 === 0 ? '#34d399' : idx % 3 === 1 ? '#f59e0b' : '#60a5fa',
                    transform: `rotate(${idx * 22.5}deg) translateY(-95px)`,
                    animation: `confettiBurst 860ms ease-out ${idx * 25}ms both`,
                  }}
                />
              ))}
            </div>

            <p className="text-sm font-semibold tracking-wide text-emerald-300">🎉 Achievement Unlocked!</p>

            <div className="relative mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/15 text-emerald-200 animate-[badgePop_550ms_ease-out]">
              {(() => {
                const Icon = ICON_MAP[activeNotification.icon] ?? Trophy
                return <Icon size={30} />
              })()}
            </div>

            <h3 className="mt-4 text-2xl font-bold text-white">{activeNotification.title}</h3>
            <p className="mt-2 text-sm text-slate-300">
              {activeNotification.description || 'You reached a new milestone in your learning journey.'}
            </p>

            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-emerald-300/80">{activeNotification.category}</p>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-emerald-400/90 animate-[popupTimer_3s_linear_forwards]" />
            </div>

            <style>{`
              @keyframes popupIn {
                0% { opacity: 0; transform: translateY(16px) scale(0.9); }
                70% { opacity: 1; transform: translateY(-2px) scale(1.03); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes popupFadeOut {
                from { opacity: 1; transform: translateY(0) scale(1); }
                to { opacity: 0; transform: translateY(-8px) scale(0.97); }
              }
              @keyframes badgePop {
                0% { transform: scale(0.45) rotate(-8deg); }
                65% { transform: scale(1.12) rotate(4deg); }
                100% { transform: scale(1) rotate(0deg); }
              }
              @keyframes confettiBurst {
                0% { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
                15% { opacity: 1; }
                100% { opacity: 0; transform: translate(-50%, -50%) translateY(-120px) scale(1) rotate(240deg); }
              }
              @keyframes popupTimer {
                from { width: 100%; }
                to { width: 0%; }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onPointerDown={closeMobileSidebar}
          onTouchStart={closeMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'hidden lg:block h-screen sticky top-0 self-start',
        desktopSidebarExpanded ? 'w-[240px]' : 'w-[68px]',
        'transition-all duration-300 shrink-0'
      )}
        ref={desktopSidebarRef}
        onMouseEnter={() => {
          if (sidebarCollapsed) setSidebarHoverOpen(true)
        }}
        onMouseLeave={() => {
          if (sidebarCollapsed) setSidebarHoverOpen(false)
        }}
      >
        <Sidebar
          collapsed={!desktopSidebarExpanded}
          onCollapse={() => {
            setSidebarCollapsed(v => !v)
            setSidebarHoverOpen(false)
          }}
        />
      </div>

      {/* Mobile sidebar */}
      <div className={cn(
        'fixed left-0 top-0 h-full z-30 w-[240px] transition-transform duration-300 lg:hidden',
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
        ref={mobileSidebarRef}
        onPointerDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
      >
        <Sidebar
          collapsed={false}
          onCollapse={closeMobileSidebar}
          isMobile
          onNavigate={closeMobileSidebar}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onMenuToggle={() => setMobileSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
