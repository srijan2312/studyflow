import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  Sparkles,
  LayoutDashboard,
  BookOpen,
  Target,
  Crosshair,
  BookCheck,
  BarChart3,
  Calendar,
  FileText,
  Bookmark,
  Trophy,
  Settings,
  ShieldCheck,
  ChevronDown,
  ArrowRight,
  Zap,
  Clock3,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'
import Card, { CardContent, StatCard } from '../../components/ui/Card'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { cn } from '../../lib/utils'

const FAQ_SECTIONS = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Sparkles,
    color: 'indigo',
    accent: 'from-indigo-500/18 via-indigo-500/8 to-transparent',
    description: 'How the app fits together and how to begin using it effectively.',
    faqs: [
      {
        q: 'What is StudyFlow built for?',
        a: 'StudyFlow is a personal learning operating system. It helps you log study sessions, manage goals, complete daily challenges, track mastery, save learning resources, write notes, review analytics, and keep your learning system in one place.',
        bullets: ['Use it daily for logging and planning.', 'Use it weekly for review, trends, and cleanup.', 'Use it as a second brain for notes and resources.'],
      },
      {
        q: 'What should I set up first?',
        a: 'Start with three basics: create a few goals, log your first study session, and save a resource or note. That gives the dashboard enough data to become useful instead of looking empty.',
        bullets: ['Add one active goal.', 'Log one real study block.', 'Save one note or resource you will revisit.'],
      },
      {
        q: 'How do the pages connect to each other?',
        a: 'The dashboard summarizes everything. Study Tracker feeds daily and weekly activity. Goals and Challenges shape what you work on. Topic Mastery and Analytics show progress quality. Notes and Resources store knowledge. Calendar helps planning. Achievements adds momentum.',
      },
    ],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: LayoutDashboard,
    color: 'cyan',
    accent: 'from-cyan-500/18 via-cyan-500/8 to-transparent',
    description: 'Your command center for the day, week, and current priorities.',
    faqs: [
      {
        q: 'What should I use the dashboard for every day?',
        a: 'Use it as your morning and evening check-in. In the morning, check streak, active goals, and quick actions. In the evening, review study time, completed work, and recent activity.',
      },
      {
        q: 'What do the top stats mean?',
        a: 'The top cards summarize your current system health: study time, active goals, streak, and completed work. They are meant to answer whether you are showing up consistently, not just how much data exists.',
      },
      {
        q: 'What are quick actions on the dashboard for?',
        a: 'Quick actions let you create sessions, goals, and resources without navigating away. Use them when you need speed and do not want to break focus.',
      },
    ],
  },
  {
    id: 'tracker',
    title: 'Study Tracker',
    icon: BookOpen,
    color: 'purple',
    accent: 'from-purple-500/18 via-purple-500/8 to-transparent',
    description: 'Log sessions, capture subjects, and build a realistic study history.',
    faqs: [
      {
        q: 'How should I log study sessions properly?',
        a: 'Log sessions as real blocks of focused work with clear start and end times, subject, topic, and optional notes. The quality of your analytics depends on how honest this page is.',
        bullets: ['Prefer fewer accurate logs over many vague ones.', 'Use notes for context like what you solved or where you got stuck.'],
      },
      {
        q: 'Why does session duration matter so much?',
        a: 'Duration powers your totals, streak interpretation, weekly charts, and overall momentum signals. If session times are sloppy, everything downstream becomes less trustworthy.',
      },
      {
        q: 'Can I use Study Tracker like a pomodoro log?',
        a: 'Yes. Many users log each focused block as a session. That works well if you want better granularity in analytics and a more honest picture of effort.',
      },
    ],
  },

  {
  id: 'routines',
  title: 'Study Routines',
  icon: CheckCircle2,
  color: 'indigo',
  accent: 'from-indigo-500/18 via-indigo-500/8 to-transparent',
  description: 'Build consistent study habits with daily, weekly, or custom routines.',
  faqs: [
    {
      q: 'What are Study Routines used for?',
      a: 'Study Routines help you build consistent learning habits. Instead of tracking random sessions, routines let you define recurring actions like practicing DSA every Monday or revising notes daily.',
      bullets: [
        'Use routines for repetition-based learning.',
        'Track whether you showed up on scheduled days.',
        'See monthly consistency through the routine tracker grid.',
      ],
    },
    {
      q: 'What routine frequencies can I create?',
      a: 'You can create routines with three scheduling modes depending on how structured your learning habit is.',
      bullets: [
        'Daily — runs every day.',
        'Weekly — runs once per week on a chosen weekday.',
        'Custom — runs on selected days such as Sun, Wed, Sat.',
      ],
    },
    {
      q: 'How does the routine tracker grid work?',
      a: 'Each row represents one routine and each column represents a day in the month. Clicking a box marks that routine as completed for that day.',
      bullets: [
        'Green check = routine completed.',
        'Empty box = not completed yet.',
        'Cross icon = that day is not scheduled for the routine.',
      ],
    },
    {
      q: 'Why are some days locked or inactive?',
      a: 'Routine cells may be inactive if the date is before the routine start date, outside the scheduled weekday pattern, or in the future where logging is not allowed yet.',
    },
    {
      q: 'How should I design effective study routines?',
      a: 'Good routines are small, repeatable actions that compound over time. Avoid making routines too large or unrealistic.',
      bullets: [
        'Example: “Solve 3 DSA problems.”',
        'Example: “Review yesterday’s notes.”',
        'Example: “Watch one lecture and summarize it.”',
      ],
    },
  ],
},
  {
    id: 'goals-challenges',
    title: 'Goals & Challenges',
    icon: Target,
    color: 'rose',
    accent: 'from-rose-500/18 via-rose-500/8 to-transparent',
    description: 'Longer-term direction from goals, daily pressure from challenges.',
    faqs: [
      {
        q: 'What is the difference between Goals and Daily Challenges?',
        a: 'Goals are larger outcomes with longer timelines. Daily Challenges are short-term pushes that create urgency for today. Use goals for direction and challenges for execution pressure.',
      },
      {
        q: 'How many active goals should I keep?',
        a: 'Keep a small active set. Three to five active goals is usually enough. More than that tends to create fake progress and divided attention.',
      },
      {
        q: 'How should I write a good goal?',
        a: 'A strong goal is specific, measurable, and tied to a deadline or milestone. Instead of writing “study math,” write “finish integration problem set 4 before Saturday.”',
      },
      {
        q: 'When should I use Daily Challenges?',
        a: 'Use them when you need accountability for a single day, want to break inertia, or want a visible mini-win. They work best when the challenge is concrete and finishable.',
      },
    ],
  },
  {
    id: 'mastery-analytics',
    title: 'Mastery & Analytics',
    icon: BookCheck,
    color: 'emerald',
    accent: 'from-emerald-500/18 via-emerald-500/8 to-transparent',
    description: 'Understand not just effort, but how your learning is actually improving.',
    faqs: [
      {
        q: 'What is Topic Mastery for?',
        a: 'Topic Mastery tracks your confidence and progress topic by topic. It helps you distinguish between time spent and actual understanding.',
      },
      {
        q: 'What should I look for in Analytics?',
        a: 'Look for patterns, not vanity numbers. Focus on consistency, subject distribution, high-performing days, drop-off periods, and whether your effort matches your priorities.',
      },
      {
        q: 'How often should I review Analytics?',
        a: 'Weekly is the sweet spot. Daily review is useful for momentum, but weekly review is where better planning decisions happen.',
      },
      {
        q: 'What is a practical way to use Mastery with Tracker?',
        a: 'After logging sessions for a topic, update its mastery separately. That forces you to ask whether the time improved understanding or was just motion.',
      },
    ],
  },
  {
    id: 'calendar-notes-resources',
    title: 'Calendar, Notes & Resources',
    icon: Calendar,
    color: 'amber',
    accent: 'from-amber-500/18 via-amber-500/8 to-transparent',
    description: 'Plan your schedule, capture ideas, and build a reusable learning library.',
    faqs: [
      {
        q: 'How should I use the Calendar page?',
        a: 'Use Calendar for time awareness and planning context. It helps you see workload distribution and avoid treating every day like it has unlimited capacity.',
      },
      {
        q: 'What makes the Notes page useful instead of messy?',
        a: 'Keep notes lightweight and searchable. Use one note per concept, lecture, or problem set rather than dumping everything into one giant document.',
        bullets: ['Use the title like a document heading.', 'Keep the body focused on explanation, steps, or takeaways.', 'Pin important notes you revisit often.'],
      },
      {
        q: 'What does autosave in Notes do?',
        a: 'The editor keeps your current writing state safe while you work and then saves permanent notes when you explicitly save or update them. It is designed to reduce fear of losing work while keeping you in control.',
      },
      {
        q: 'What is the Resources page best used for?',
        a: 'Resources is your curated learning library. Save videos, articles, PDFs, courses, and books that are worth revisiting, not every random link you touched once.',
      },
      {
        q: 'How do bookmarks and ratings help in Resources?',
        a: 'Bookmarks mark priority items. Ratings help you identify the most useful resources after using them. Together they turn a storage page into a ranked reference library.',
      },
    ],
  },
  {
    id: 'achievements-settings',
    title: 'Achievements & Settings',
    icon: Trophy,
    color: 'cyan',
    accent: 'from-cyan-500/18 via-cyan-500/8 to-transparent',
    description: 'Reward consistency, tune preferences, and protect your account data.',
    faqs: [
      {
        q: 'What are Achievements meant to do?',
        a: 'Achievements are reinforcement, not the main game. They help maintain momentum by rewarding consistency, completion, and habit formation over time.',
      },
      {
        q: 'What can I customize in Settings?',
        a: 'Settings covers profile data, security, accent color, notifications, backup/export options, weekly report preferences, and your local account activity log.',
      },
      {
        q: 'How does data backup work?',
        a: 'The app gives you export and backup tools so you can keep a copy of your data outside the interface. Use backup regularly if your data matters to your workflow.',
      },
      {
        q: 'What is the account activity log for?',
        a: 'It provides a local record of sensitive actions like updates, exports, and security changes. It is useful for visibility and personal auditing.',
      },
    ],
  },
  {
    id: 'privacy-and-best-practice',
    title: 'Best Practice',
    icon: ShieldCheck,
    color: 'indigo',
    accent: 'from-indigo-500/18 via-sky-500/8 to-transparent',
    description: 'How to keep the system clean, useful, and trustworthy over time.',
    faqs: [
      {
        q: 'What is the best way to keep the app useful long-term?',
        a: 'Review and prune regularly. Archive stale notes, delete low-value resources, close completed goals, and keep your dashboard fed with current data instead of old clutter.',
      },
      {
        q: 'How often should I clean the system?',
        a: 'Do a quick cleanup weekly and a deeper reset monthly. Weekly cleanup keeps pages usable. Monthly cleanup keeps the whole system strategically aligned.',
      },
      {
        q: 'What is the biggest mistake people make with study systems like this?',
        a: 'Turning the system into a performance ritual instead of a thinking tool. If you spend more time decorating the system than using it to learn, the system is failing.',
      },
    ],
  },
]

const QUICK_LINKS = [
  { label: 'Dashboard', icon: LayoutDashboard, route: '/app', blurb: 'See your daily command center.' },
  { label: 'Study Tracker', icon: BookOpen, route: '/app/tracker', blurb: 'Log focused study sessions.' },
  { label: 'Goals', icon: Target, route: '/app/goals', blurb: 'Define outcomes and deadlines.' },
  { label: 'Challenges', icon: Crosshair, route: '/app/challenges', blurb: 'Create pressure for today.' },
  { label: 'Topic Mastery', icon: BookCheck, route: '/app/mastery', blurb: 'Track understanding by topic.' },
  { label: 'Analytics', icon: BarChart3, route: '/app/analytics', blurb: 'Review patterns and trends.' },
  { label: 'Calendar', icon: Calendar, route: '/app/calendar', blurb: 'Plan time across your schedule.' },
  { label: 'Notes', icon: FileText, route: '/app/notes', blurb: 'Write and organize learning notes.' },
  { label: 'Resources', icon: Bookmark, route: '/app/resources', blurb: 'Save videos, PDFs, courses, and books.' },
  { label: 'Achievements', icon: Trophy, route: '/app/achievements', blurb: 'Use momentum-based rewards.' },
  { label: 'Settings', icon: Settings, route: '/app/settings', blurb: 'Manage profile, backup, and preferences.' },
]

function FaqAccordionItem({ item, open, onToggle, accent }) {
  return (
    <Card className={cn('overflow-hidden border-slate-800/65 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))] transition-all duration-300', open && 'border-slate-700/80 shadow-[0_18px_40px_-30px_rgba(2,6,23,0.95)]')}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-5 py-4 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-base font-semibold text-slate-100">{item.q}</p>
            {'keywords' in item && item.keywords?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {item.keywords.map((keyword) => (
                  <span key={keyword} className="rounded-full border border-slate-700/70 bg-slate-900/60 px-2 py-1 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                    {keyword}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-700/70 bg-slate-950/70 text-slate-400 transition-all duration-300', open && 'border-indigo-500/40 text-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.15)]')}>
            <ChevronDown size={17} className={cn('transition-transform duration-300', open && 'rotate-180')} />
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-800/70 px-5 pb-5 pt-4">
          <div className={cn('absolute pointer-events-none inset-x-0 h-px bg-gradient-to-r from-transparent to-transparent', accent)} />
          <p className="text-sm leading-7 text-slate-300">{item.a}</p>
          {item.bullets?.length > 0 && (
            <div className="mt-4 space-y-2">
              {item.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-2.5 text-sm text-slate-400">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export default function Faq() {
  const [query, setQuery] = useState('')
  const [activeSection, setActiveSection] = useState('all')
  const [openItems, setOpenItems] = useState(() => new Set(['Getting Started-0']))

  const totalQuestions = FAQ_SECTIONS.reduce((count, section) => count + section.faqs.length, 0)

  const filteredSections = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return FAQ_SECTIONS
      .filter((section) => activeSection === 'all' || section.id === activeSection)
      .map((section) => {
        const faqs = section.faqs.filter((item) => {
          if (!normalizedQuery) return true
          return [section.title, item.q, item.a, ...(item.bullets ?? [])]
            .join(' ')
            .toLowerCase()
            .includes(normalizedQuery)
        })
        return { ...section, faqs }
      })
      .filter((section) => section.faqs.length > 0)
  }, [activeSection, query])

  const visibleQuestionCount = filteredSections.reduce((count, section) => count + section.faqs.length, 0)

  const toggleItem = (key) => {
    setOpenItems((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="p-6 md:p-8 space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-800/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))] px-6 py-7 md:px-8">
        <div className="pointer-events-none absolute -right-20 top-0 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute left-0 top-0 h-32 w-full bg-gradient-to-r from-cyan-500/8 via-transparent to-purple-500/8" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
              <Sparkles size={12} />
              Product Handbook
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-50 md:text-[2.6rem]">
              FAQ and feature guide for the entire StudyFlow workspace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400 md:text-[15px]">
              Everything important is covered here: what each page does, how features connect, what to use first, and how to turn the app into a clean, disciplined learning system.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Feature Areas</p>
              <p className="mt-2 text-3xl font-black text-slate-100">{FAQ_SECTIONS.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Questions</p>
              <p className="mt-2 text-3xl font-black text-slate-100">{totalQuestions}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Coverage</p>
              <p className="mt-2 text-lg font-bold text-emerald-300">Every core page</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<GraduationCap size={18} />} label="Quick Start" value="3" meta="Set goals, log a session, save a note" color="indigo" />
        <StatCard icon={<Zap size={18} />} label="Best Use" value="Daily" meta="Check in, work, then review" color="purple" />
        <StatCard icon={<Clock3 size={18} />} label="Review Rhythm" value="Weekly" meta="Analytics and cleanup are strongest here" color="amber" />
        <StatCard icon={<ShieldCheck size={18} />} label="System Health" value="Clean" meta="Prune stale items and keep data honest" color="emerald" />
      </div>

      <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-5">
          <Card className="border-slate-800/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))]">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-100">Search the guide</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">Find answers by page name, workflow, or feature.</p>
              </div>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search goals, notes, backup, analytics..."
                leftIcon={<Search size={15} />}
              />
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/40 px-4 py-3 text-xs text-slate-500">
                Showing <span className="font-semibold text-slate-200">{visibleQuestionCount}</span> matching answer{visibleQuestionCount === 1 ? '' : 's'}.
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))]">
            <CardContent className="space-y-3 p-5">
              <div>
                <p className="text-sm font-semibold text-slate-100">Browse by section</p>
                <p className="mt-1 text-xs leading-6 text-slate-500">Jump directly to the part of the product you want to understand.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('all')}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                    activeSection === 'all'
                      ? 'border-indigo-500/40 bg-indigo-500/12 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                      : 'border-slate-800/70 bg-slate-900/50 text-slate-400 hover:border-slate-700/80 hover:text-slate-200'
                  )}
                >
                  All sections
                </button>
                {FAQ_SECTIONS.map((section) => {
                  const Icon = section.icon
                  const active = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        active
                          ? 'border-indigo-500/40 bg-indigo-500/12 text-indigo-200 shadow-[0_0_20px_rgba(99,102,241,0.12)]'
                          : 'border-slate-800/70 bg-slate-900/50 text-slate-400 hover:border-slate-700/80 hover:text-slate-200'
                      )}
                    >
                      <Icon size={13} />
                      {section.title}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))]">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">Feature map</p>
                  <p className="mt-1 text-xs leading-6 text-slate-500">What each major page is best at.</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {QUICK_LINKS.map(({ label, icon: Icon, route, blurb }) => (
                  <Link
                    key={route}
                    to={route}
                    className="group flex items-start gap-3 rounded-2xl border border-slate-800/70 bg-slate-950/35 px-3.5 py-3 transition-all hover:-translate-y-0.5 hover:border-slate-700/80 hover:bg-slate-900/70"
                  >
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-950/80 text-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.08)]">
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-200">{label}</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">{blurb}</p>
                    </div>
                    <ArrowRight size={14} className="mt-1 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {filteredSections.length === 0 ? (
            <Card className="border-slate-800/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.96))]">
              <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <Search size={28} className="text-slate-600" />
                <h2 className="mt-4 text-xl font-semibold text-slate-100">No matching FAQ entries</h2>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                  Try a broader search like <span className="text-slate-300">notes</span>, <span className="text-slate-300">resources</span>, <span className="text-slate-300">goals</span>, or <span className="text-slate-300">backup</span>.
                </p>
                <Button variant="secondary" className="mt-5" onClick={() => { setQuery(''); setActiveSection('all') }}>
                  Reset filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredSections.map((section) => {
              const Icon = section.icon
              return (
                <section key={section.id} className="space-y-4">
                  <div className={cn('relative overflow-hidden rounded-[1.7rem] border border-slate-800/70 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.98))] p-5')}>
                    <div className={cn('pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b to-transparent', section.accent)} />
                    <div className="relative flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800/70 bg-slate-950/80 text-indigo-300 shadow-[0_0_24px_rgba(99,102,241,0.1)]">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">FAQ Section</p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-50">{section.title}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{section.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {section.faqs.map((item, index) => {
                      const key = `${section.title}-${index}`
                      return (
                        <FaqAccordionItem
                          key={key}
                          item={item}
                          open={openItems.has(key)}
                          onToggle={() => toggleItem(key)}
                          accent={section.accent}
                        />
                      )
                    })}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </section>
    </div>
  )
}
