import { Fragment, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { useEffect, useState } from "react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  GraduationCap, ArrowRight, BarChart3, Target, Zap, BookOpen,
  Flame, Calendar, Check, Users, TrendingUp, Award, ChevronRight, X
} from 'lucide-react'

gsap.registerPlugin(ScrollTrigger)

const HERO_PARTICLES = [
  { left: '8%', top: '22%', size: 4 },
  { left: '16%', top: '38%', size: 3 },
  { left: '24%', top: '14%', size: 2 },
  { left: '33%', top: '30%', size: 4 },
  { left: '41%', top: '18%', size: 3 },
  { left: '49%', top: '42%', size: 2 },
  { left: '57%', top: '24%', size: 3 },
  { left: '65%', top: '16%', size: 2 },
  { left: '72%', top: '36%', size: 4 },
  { left: '80%', top: '20%', size: 3 },
  { left: '86%', top: '32%', size: 2 },
  { left: '92%', top: '26%', size: 3 },
]

const AMBIENT_PARTICLES = [
  { left: '6%', top: '12%', size: 2 },
  { left: '12%', top: '34%', size: 3 },
  { left: '20%', top: '68%', size: 2 },
  { left: '28%', top: '24%', size: 3 },
  { left: '36%', top: '82%', size: 2 },
  { left: '44%', top: '14%', size: 2 },
  { left: '52%', top: '42%', size: 3 },
  { left: '60%', top: '76%', size: 2 },
  { left: '68%', top: '28%', size: 3 },
  { left: '74%', top: '56%', size: 2 },
  { left: '82%', top: '18%', size: 2 },
  { left: '90%', top: '44%', size: 3 },
  { left: '15%', top: '90%', size: 2 },
  { left: '40%', top: '58%', size: 2 },
  { left: '63%', top: '8%', size: 2 },
  { left: '88%', top: '84%', size: 2 },
]

const PRODUCTIVITY_TREND = [
  { week: 'Week 1', focus: 42 },
  { week: 'Week 2', focus: 54 },
  { week: 'Week 3', focus: 67 },
  { week: 'Week 4', focus: 81 },
  { week: 'Week 5', focus: 92 },
]

const PRODUCTIVITY_BREAKDOWN = [
  { label: 'Deep work', hours: 9.4 },
  { label: 'Revision', hours: 7.1 },
  { label: 'Practice', hours: 11.2 },
  { label: 'Reflection', hours: 4.8 },
]

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Productivity', href: '#productivity' },
  { label: 'How it works', href: '#process' },
  { label: 'Get started', href: '#cta' },
]



function LandingChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/95 px-3 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-cyan-300">{payload[0].value} focus points</p>
    </div>
  )
}

function LandingBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/95 px-3 py-2 shadow-[0_16px_36px_rgba(0,0,0,0.45)]">
      <p className="text-[11px] text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-indigo-300">{payload[0].value}h logged</p>
    </div>
  )
}

/* ── Mini animated dashboard preview ─────────────────── */
function DashboardPreview() {
  const previewRef = useRef(null)

  useGSAP(() => {
    gsap.fromTo(
      '.preview-bar',
      { height: 0, opacity: 0.4 },
      {
        height: (_, el) => `${el.dataset.height}%`,
        opacity: 0.9,
        duration: 0.9,
        stagger: 0.08,
        ease: 'power3.out',
        delay: 0.3,
      }
    )

    gsap.fromTo(
      '.preview-progress-fill',
      { width: 0 },
      {
        width: (_, el) => `${el.dataset.value}%`,
        duration: 1,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.45,
      }
    )

    gsap.utils.toArray('.preview-count').forEach((el, index) => {
      const target = Number(el.dataset.target || 0)
      const suffix = el.dataset.suffix || ''
      const counter = { value: 0 }
      gsap.to(counter, {
        value: target,
        duration: 1.1,
        delay: 0.2 + index * 0.12,
        ease: 'power2.out',
        onUpdate: () => {
          const number = suffix === '%' ? Math.round(counter.value) : counter.value.toFixed(1)
          el.textContent = `${number}${suffix}`
        },
      })
    })
  }, { scope: previewRef })

  return (
    <div ref={previewRef} className="relative w-full max-w-2xl mx-auto">
      {/* Glow behind */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-cyan-500/20 rounded-3xl blur-3xl scale-95" />

      {/* Main card */}
      <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800/60 bg-slate-950/60">
          <div className="flex gap-1.5">
            {['#ef4444','#f59e0b','#22c55e'].map(c => (
              <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
            ))}
          </div>
          <div className="flex-1 flex justify-center">
            <div className="px-6 py-1 rounded-md bg-slate-800/80 border border-slate-700/40 text-[10px] text-slate-500 font-mono">
              studyflow.app/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard content */}
        <div className="flex">
          {/* Mini sidebar */}
          <div className="w-12 bg-slate-950/60 border-r border-slate-800/40 flex flex-col items-center py-4 gap-3.5">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-sm bg-indigo-400/80" />
            </div>
            {[1,2,3,4].map(i => (
              <div key={i} className="w-5 h-1.5 rounded bg-slate-700/60" />
            ))}
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 space-y-3">
            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Today', target: 3.4, suffix: 'h', color: 'from-indigo-500 to-purple-500' },
                { label: 'Focus', target: 92, suffix: '%', color: 'from-orange-500 to-red-500' },
                { label: 'Goals', target: 78, suffix: '%', color: 'from-emerald-500 to-teal-500' },
              ].map(({ label, target, suffix, color }) => (
                <div key={label} className="rounded-xl bg-slate-800/60 border border-slate-700/30 p-3">
                  <p className="text-[9px] text-slate-500 mb-1">{label}</p>
                  <p className={`preview-count text-sm font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`} data-target={target} data-suffix={suffix}>0{suffix}</p>
                </div>
              ))}
            </div>

            {/* Chart preview */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-3">
              <p className="text-[9px] text-slate-500 mb-2">Weekly Progress</p>
              <div className="flex items-end gap-1.5 h-14">
                {[40, 65, 35, 80, 55, 90, 70].map((h, i) => (
                  <div
                    key={i}
                    data-height={h}
                    className="preview-bar flex-1 rounded-sm bg-gradient-to-t from-indigo-600 to-indigo-400 opacity-80"
                    style={{ height: 0 }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {['M','T','W','T','F','S','S'].map((d, index) => (
                  <span key={`${d}-${index}`} className="text-[8px] text-slate-600">{d}</span>
                ))}
              </div>
            </div>

            {/* Progress bars */}
            <div className="rounded-xl bg-slate-800/40 border border-slate-700/30 p-3 space-y-2">
              <p className="text-[9px] text-slate-500 mb-1">Skills</p>
              {[
                { name: 'Web Dev', pct: 78, color: 'from-indigo-500 to-purple-500' },
                { name: 'DSA', pct: 55, color: 'from-cyan-500 to-blue-500' },
                { name: 'ML', pct: 32, color: 'from-emerald-500 to-teal-500' },
              ].map(({ name, pct, color }) => (
                <div key={name} className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-slate-400">{name}</span>
                    <span className="text-[9px] text-slate-500">{pct}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-700/60">
                    <div data-value={pct} className={`preview-progress-fill h-full rounded-full bg-gradient-to-r ${color}`} style={{ width: 0 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Feature card ─────────────────────────────────────── */
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  const colorMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }
  return (
    <div className="feature-card rounded-2xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-sm p-6 card-hover group hover:scale-[1.03] hover:shadow-[0_28px_70px_rgba(99,102,241,0.2)] hover:border-indigo-400/40 transition-all duration-300">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 border ${colorMap[color]}`}>
        <Icon size={20} />
      </div>
      <h3 className="text-base font-semibold text-slate-100 mb-2 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
    </div>
  )
}

function ProcessConnector() {
  return (
    <div className="hidden md:flex items-center justify-center w-20 shrink-0">
      <svg className="w-full h-8 overflow-visible" viewBox="0 0 96 32" fill="none" preserveAspectRatio="none">
        <path className="flow-arrow-path" d="M2 16 C 28 16, 52 16, 78 16" stroke="rgba(99,102,241,0.9)" strokeWidth="3" strokeLinecap="round" />
        <path className="flow-arrow-head" d="M78 10 L90 16 L78 22 Z" fill="rgba(6,182,212,0.9)" />
      </svg>
    </div>
  )
}

/* ── Main Landing Page ────────────────────────────────── */
export default function Landing() {
  const pageRef = useRef(null)
  const heroRef = useRef(null)
  const featuresRef = useRef(null)
  const comparisonRef = useRef(null)
  const graphRef = useRef(null)
  const howRef = useRef(null)
  const statsRef = useRef(null)
  const ctaRef = useRef(null)
  const [showDeletePopup, setShowDeletePopup] = useState(false)

  useEffect(() => {
  if (sessionStorage.getItem("accountDeleted")) {
    setShowDeletePopup(true)
    sessionStorage.removeItem("accountDeleted")

    setTimeout(() => {
      setShowDeletePopup(false)
    }, 4000)
  }
}, [])

  useGSAP(() => {
    gsap.to('.ambient-blob', {
      x: 'random(-120, 120)',
      y: 'random(-90, 90)',
      scale: 'random(0.88, 1.16)',
      duration: 'random(14, 24)',
      repeat: -1,
      yoyo: true,
      repeatRefresh: true,
      ease: 'sine.inOut',
      stagger: 0.5,
    })

    gsap.set('.ambient-star', { willChange: 'transform, opacity' })

    gsap.fromTo(
      '.ambient-star',
      { x: 0, y: 0, opacity: 0.15, scale: 0.9 },
      {
        x: () => gsap.utils.random(-55, 55),
        y: () => gsap.utils.random(-75, 75),
        opacity: () => gsap.utils.random(0.2, 0.85),
        scale: () => gsap.utils.random(0.9, 1.25),
        duration: () => gsap.utils.random(3.2, 7.4),
        repeat: -1,
        yoyo: true,
        repeatRefresh: true,
        ease: 'sine.inOut',
        stagger: { each: 0.03, from: 'random' },
      }
    )
  }, { scope: pageRef })

  useGSAP(() => {
    // Hero animations
    const tl = gsap.timeline({ delay: 0.12 })
    tl.fromTo('.hero-badge', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.42, ease: 'power3.out' })
      .fromTo('.hero-word', { opacity: 0, y: 44, scale: 0.95 }, { opacity: 1, y: 0, scale: 1, duration: 0.56, stagger: 0.06, ease: 'power3.out' }, '-=0.2')
      .to('.hero-underline', { width: '100%', duration: 0.6, ease: 'power3.out' }, '-=0.12')
      .fromTo('.hero-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, '-=0.28')
      .fromTo('.hero-cta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.42, stagger: 0.08, ease: 'power3.out' }, '-=0.22')
      .fromTo('.hero-preview', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.72, ease: 'power3.out' }, '-=0.3')

    gsap.to('.floating-orb', {
      x: 'random(-35, 35)',
      y: 'random(-45, 45)',
      duration: 'random(8, 14)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.4,
    })

    gsap.to('.hero-particle', {
      y: 'random(-45, 45)',
      x: 'random(-20, 20)',
      opacity: 'random(0.15, 0.75)',
      duration: 'random(5, 10)',
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.05,
    })

    gsap.to('.hero-shimmer', {
      backgroundPositionX: '180%',
      duration: 2.2,
      repeat: -1,
      ease: 'none',
    })

    gsap.fromTo(
      '.hero-badge-dot',
      { scale: 1, opacity: 0.9 },
      {
        scale: 1.55,
        opacity: 0.45,
        boxShadow: '0 0 18px rgba(129, 140, 248, 0.9)',
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      }
    )
  }, { scope: heroRef })

  useGSAP(() => {
    // Feature cards stagger
    gsap.fromTo(
      '.feature-card',
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 0.52,
        stagger: 0.07,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: featuresRef.current, start: 'top 92%' },
      }
    )
    gsap.fromTo(
      '.features-header',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: featuresRef.current, start: 'top 94%' },
      }
    )
  }, { scope: featuresRef })

  useGSAP(() => {
    gsap.fromTo(
      '.comparison-panel',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.08,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: comparisonRef.current, start: 'top 94%' },
      }
    )

    gsap.fromTo(
      '.comparison-row-left',
      { opacity: 0, x: -42 },
      {
        opacity: 1,
        x: 0,
        duration: 0.42,
        stagger: 0.08,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: comparisonRef.current, start: 'top 94%' },
      }
    )

    gsap.fromTo(
      '.comparison-row-right',
      { opacity: 0, x: 42 },
      {
        opacity: 1,
        x: 0,
        duration: 0.42,
        stagger: 0.08,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: comparisonRef.current, start: 'top 94%' },
      }
    )
  }, { scope: comparisonRef })

  useGSAP(() => {
    gsap.fromTo(
      '.process-step',
      { opacity: 0, y: 38 },
      {
        opacity: 1,
        y: 0,
        duration: 0.54,
        stagger: 0.09,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: howRef.current, start: 'top 94%' },
      }
    )

    const paths = gsap.utils.toArray('.flow-arrow-path')
    paths.forEach((path) => {
      const length = path.getTotalLength()
      gsap.set(path, { strokeDasharray: `0 ${length}`, strokeDashoffset: 0, opacity: 0 })
      gsap.to(path, {
        strokeDasharray: `${length} ${length}`,
        opacity: 1,
        duration: 0.62,
        ease: 'power2.out',
        scrollTrigger: { trigger: howRef.current, start: 'top 94%' },
      })
    })

    gsap.fromTo(
      '.flow-arrow-head',
      { opacity: 0, scale: 0.85, transformOrigin: 'center' },
      {
        opacity: 1,
        scale: 1,
        duration: 0.24,
        stagger: 0.07,
        ease: 'power2.out',
        immediateRender: false,
        scrollTrigger: { trigger: howRef.current, start: 'top 94%' },
      }
    )
  }, { scope: howRef })

  useGSAP(() => {
    // Stats counter
    gsap.fromTo(
      '.stat-item',
      { opacity: 0.7, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.07,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: statsRef.current, start: 'top 92%', once: true },
      }
    )

    gsap.to('.stat-icon', {
      y: -3,
      duration: 1.8,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      stagger: 0.14,
    })

    ScrollTrigger.create({
      trigger: statsRef.current,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.utils.toArray('.stat-value').forEach((el, index) => {
          const target = Number(el.dataset.target || 0)
          const suffix = el.dataset.suffix || ''
          const counter = { value: 0 }

          gsap.to(counter, {
            value: target,
            duration: 0.75,
            delay: index * 0.05,
            ease: 'power2.out',
            onUpdate: () => {
              el.textContent = `${Math.round(counter.value)}${suffix}`
            },
          })
        })
      },
    })
  }, { scope: statsRef })

  useGSAP(() => {
    gsap.fromTo(
      '.cta-content',
      { opacity: 0.75, y: 22 },
      {
        opacity: 1,
        y: 0,
        duration: 0.56,
        ease: 'power3.out',
        immediateRender: false,
        scrollTrigger: { trigger: ctaRef.current, start: 'top 94%' },
      }
    )
  }, { scope: ctaRef })

  return (
    <div ref={pageRef} className="relative isolate min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {showDeletePopup && (
  <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100]">
    <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 text-sm text-emerald-300 shadow-lg backdrop-blur">
      <Check size={16} />
      Account deleted successfully
    </div>
  </div>
)}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="ambient-blob absolute -top-40 -left-28 w-[34rem] h-[34rem] rounded-full bg-indigo-500/16 blur-[120px]" />
        <div className="ambient-blob absolute top-[18%] -right-20 w-[28rem] h-[28rem] rounded-full bg-purple-500/14 blur-[110px]" />
        <div className="ambient-blob absolute bottom-[-10rem] left-[30%] w-[30rem] h-[30rem] rounded-full bg-cyan-500/12 blur-[130px]" />
        <div className="ambient-blob absolute bottom-[16%] right-[22%] w-[18rem] h-[18rem] rounded-full bg-emerald-500/10 blur-[100px]" />
        {AMBIENT_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="ambient-star absolute rounded-full bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.55)]"
            style={{ left: p.left, top: p.top, width: `${p.size}px`, height: `${p.size}px` }}
          />
        ))}
      </div>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 h-16 bg-slate-950/80 backdrop-blur-2xl border-b border-slate-800/50">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow-sm">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="text-[0.9375rem] font-bold gradient-text">StudyFlow</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm text-slate-400">
          {NAV_LINKS.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group relative px-1 py-1.5 text-slate-400 hover:text-slate-200 focus-visible:text-slate-100 transition-colors duration-300"
            >
              <span className="relative z-10">{item.label}</span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-0 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 transition-all duration-300 group-hover:w-[calc(100%-0.3rem)] group-focus-visible:w-[calc(100%-0.3rem)]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 bottom-0 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 transition-all duration-300 group-hover:w-[calc(100%-0.3rem)] group-focus-visible:w-[calc(100%-0.3rem)]"
              />
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="group hidden sm:block relative text-sm text-slate-400 hover:text-slate-200 focus-visible:text-slate-100 transition-colors duration-300 px-3 py-1.5"
          >
            <span className="relative z-10">Sign in</span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1 h-px w-0 -translate-x-1/2 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 transition-all duration-300 group-hover:w-[calc(100%-1.2rem)] group-focus-visible:w-[calc(100%-1.2rem)]"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 bottom-1 h-[2px] w-0 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 transition-all duration-300 group-hover:w-[calc(100%-1.2rem)] group-focus-visible:w-[calc(100%-1.2rem)]"
            />
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow-sm hover:shadow-glow hover:-translate-y-0.5 transition-all"
          >
            Get started
            <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-6 md:px-10 overflow-hidden">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-hero-mesh pointer-events-none" />

        {/* Gradient orbs */}
        <div className="floating-orb orb w-[500px] h-[500px] top-[-100px] right-[-100px] bg-indigo-600/20 animate-float" />
        <div className="floating-orb orb w-[400px] h-[400px] bottom-0 left-[-100px] bg-purple-600/15 animate-float-delay" />
        <div className="floating-orb orb w-[300px] h-[300px] top-[200px] left-[30%] bg-cyan-500/10 animate-float-slow" />
        {HERO_PARTICLES.map((p, i) => (
          <span
            key={i}
            className="hero-particle absolute rounded-full bg-white/60 shadow-[0_0_14px_rgba(255,255,255,0.6)] blur-[1px] pointer-events-none"
            style={{ left: p.left, top: p.top, width: `${p.size}px`, height: `${p.size}px` }}
          />
        ))}

        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="hero-badge opacity-0 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm">
            <span className="hero-badge-dot w-2 h-2 rounded-full bg-indigo-400" />
            Premium Study Platform — Now with AI Goals
            <ChevronRight size={14} />
          </div>

          {/* Title */}
          <h1 className="hero-title text-5xl md:text-7xl font-black tracking-tight leading-[1.05]">
            <span className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-[520px] h-[220px] bg-[radial-gradient(circle,rgba(99,102,241,0.3)_0%,rgba(139,92,246,0.18)_35%,rgba(2,6,23,0)_70%)] blur-3xl pointer-events-none" />
            <span className="hero-word opacity-0 inline-block mr-3 text-slate-100">Master</span>
            <span className="hero-word opacity-0 inline-block mr-3 text-slate-100">Your</span>
            <span className="hero-word opacity-0 inline-block gradient-text">Learning</span>
            <span className="hero-word opacity-0 block gradient-text mt-2">Journey</span>
            <span className="hero-underline block h-1 w-0 mx-auto mt-4 rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.95)_0%,rgba(139,92,246,0.95)_45%,rgba(6,182,212,0.95)_100%)] shadow-[0_0_20px_rgba(99,102,241,0.6)]" />
            <span className="hero-shimmer block h-[2px] w-56 mx-auto mt-2 rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0)_0%,rgba(99,102,241,0.9)_35%,rgba(6,182,212,0.9)_65%,rgba(6,182,212,0)_100%)] bg-[length:200%_100%] bg-[-100%_0]" />
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle opacity-0 max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed">
            The premium productivity platform for serious students. Track daily study sessions,
            visualize skill growth, crush your goals, and build unstoppable learning habits.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="hero-cta opacity-0 group inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-base font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-[length:200%_100%] bg-[position:0%_50%] text-white shadow-[0_12px_32px_rgba(79,70,229,0.35)] hover:bg-[position:100%_50%] hover:scale-105 hover:shadow-[0_18px_45px_rgba(99,102,241,0.55)] transition-all duration-500 w-full sm:w-auto justify-center"
            >
              Start for free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <button
              type="button"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              className="hero-cta opacity-0 inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-base font-semibold bg-white/[0.06] text-slate-200 border border-white/10 hover:bg-white/[0.10] hover:border-white/20 transition-all w-full sm:w-auto justify-center"
            >
              Explore features
              <ArrowRight size={16} className="opacity-70" />
            </button>
          </div>

          {/* Social proof */}
          <p className="text-sm text-slate-600">
            No credit card required · Free forever plan · Loved by 10,000+ students
          </p>

          {/* Dashboard preview */}
          <div className="hero-preview opacity-0 mt-10">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section ref={featuresRef} id="features" className="py-24 px-6 md:px-10 relative">
        <div className="max-w-6xl mx-auto">
          <div className="features-header text-center mb-16 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-700/60 bg-slate-800/40 text-slate-400 text-sm">
              <Zap size={13} className="text-indigo-400" />
              Everything you need to excel
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100">
              Feature showcase for serious learners
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">
              Everything you need in one premium workflow to plan, execute, and improve your study system.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: BookOpen, title: 'Smart Study Tracker', desc: 'Track sessions with time, subject, and difficulty.', color: 'indigo' },
              { icon: BarChart3, title: 'Skill Progress Analytics', desc: 'Visualize learning growth with charts.', color: 'cyan' },
              { icon: Target, title: 'Goal Completion System', desc: 'Break big goals into smaller milestones.', color: 'purple' },
              { icon: Flame, title: 'Study Streak Motivation', desc: 'Build consistency with streak tracking.', color: 'amber' },
              { icon: Calendar, title: 'Calendar Planning', desc: 'Plan your weekly study schedule.', color: 'rose' },
              { icon: Zap, title: 'Resource Manager', desc: 'Save courses, articles, and videos.', color: 'emerald' },
            ].map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────── */}
      <section id="comparison" ref={comparisonRef} className="py-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <p className="text-sm md:text-base uppercase tracking-[0.24em] text-slate-500">Why it matters</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100">Traditional studying vs StudyFlow</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="comparison-panel rounded-2xl border border-slate-700/60 bg-slate-900/45 p-6 hover:scale-[1.03] hover:border-rose-400/40 hover:shadow-[0_28px_70px_rgba(244,63,94,0.14)] transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-300/90 mb-4">Traditional</p>
              <div className="rounded-xl border border-slate-700/50 bg-slate-950/60 divide-y divide-slate-800/70">
                {['messy notes', 'inconsistent study', 'no progress tracking', 'forgotten goals'].map((item, i) => (
                  <div key={item} className="comparison-row-left flex items-center gap-3 px-4 py-3 text-sm text-slate-400">
                    <span className="w-6 h-6 rounded-lg border border-rose-500/40 bg-rose-500/15 flex items-center justify-center shrink-0">
                      <X size={13} className="text-rose-300" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="comparison-panel rounded-2xl border border-slate-700/60 bg-slate-900/45 p-6 hover:scale-[1.03] hover:border-emerald-400/40 hover:shadow-[0_28px_70px_rgba(16,185,129,0.16)] transition-all duration-300">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90 mb-4">StudyFlow</p>
              <div className="rounded-xl border border-slate-700/50 bg-slate-950/60 divide-y divide-slate-800/70">
                {['structured study sessions', 'goal completion tracking', 'analytics dashboards', 'streak motivation'].map((item) => (
                  <div key={item} className="comparison-row-right flex items-center gap-3 px-4 py-3 text-sm text-slate-300">
                    <span className="w-6 h-6 rounded-lg border border-emerald-500/40 bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Check size={13} className="text-emerald-300" />
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Productivity Graph ─────────────────────────────── */}
      <section id="productivity" ref={graphRef} className="py-24 px-6 md:px-10">
        <div className="max-w-5xl mx-auto rounded-3xl border border-slate-700/50 bg-slate-900/55 p-8 md:p-10 shadow-[0_28px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-600 mb-3">Productivity lift</p>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-100">Your focus graph climbs as your system improves</h3>
              <p className="mt-3 max-w-2xl text-sm text-slate-400">A visible weekly view of momentum, deep work, and deliberate practice so the section reads as a real product snapshot instead of a decorative placeholder.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[18rem]">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-emerald-300/80">Productivity</p>
                <p className="mt-2 text-2xl font-bold text-white">+38%</p>
                <p className="mt-1 text-xs text-slate-400">vs first tracked week</p>
              </div>
              <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">Consistency</p>
                <p className="mt-2 text-2xl font-bold text-white">5 weeks</p>
                <p className="mt-1 text-xs text-slate-400">without breaking streak</p>
              </div>
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
            <div className="rounded-2xl border border-slate-800/70 bg-slate-950/65 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-200">Focus trend</p>
                  <p className="text-xs text-slate-500">Weekly focus score based on tracked sessions and completion rate</p>
                </div>
                <div className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-200">Stable growth</div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PRODUCTIVITY_TREND} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="landingAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(51,65,85,0.45)" vertical={false} strokeDasharray="4 6" />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={34} />
                    <Tooltip content={<LandingChartTooltip />} cursor={{ stroke: 'rgba(34,211,238,0.35)', strokeWidth: 1 }} />
                    <Area type="monotone" dataKey="focus" stroke="#22d3ee" strokeWidth={3} fill="url(#landingAreaGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/65 p-5">
                <p className="text-sm font-semibold text-slate-200">Study mix</p>
                <p className="mt-1 text-xs text-slate-500">Hours distributed across the routines that move progress fastest</p>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PRODUCTIVITY_BREAKDOWN} margin={{ top: 8, right: 0, left: -22, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(51,65,85,0.35)" vertical={false} strokeDasharray="4 6" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} width={28} />
                      <Tooltip content={<LandingBarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                      <Bar dataKey="hours" radius={[10, 10, 0, 0]} fill="#818cf8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Deep work sessions', value: '24', tone: 'text-indigo-300' },
                  { label: 'Completion rate', value: '87%', tone: 'text-cyan-300' },
                  { label: 'Average focus block', value: '52m', tone: 'text-emerald-300' },
                  { label: 'Recovered missed days', value: '3', tone: 'text-amber-300' },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-800/70 bg-slate-950/50 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500">{item.label}</p>
                    <p className={`mt-2 text-xl font-bold ${item.tone}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────── */}
      <section id="process" ref={howRef} className="py-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-3">
            <p className="text-sm md:text-base uppercase tracking-[0.22em] text-slate-500">How StudyFlow works</p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-100">A visual process for consistent growth</h2>
          </div>
          <div className="flex flex-col md:flex-row md:items-stretch md:justify-center gap-5 md:gap-0">
            {[
              { step: 'Step 1', icon: BookOpen, title: 'Log Study Session', desc: 'Track what you studied.' },
              { step: 'Step 2', icon: Target, title: 'Set Goals', desc: 'Define milestones.' },
              { step: 'Step 3', icon: BarChart3, title: 'Track Progress', desc: 'View analytics.' },
              { step: 'Step 4', icon: Flame, title: 'Improve Consistency', desc: 'Build study streaks.' },
            ].map((item, index, arr) => {
              const Icon = item.icon
              return (
                <Fragment key={item.step}>
                  <div className="process-step md:flex-1 rounded-2xl border border-slate-700/50 bg-slate-900/55 p-6 hover:scale-[1.03] hover:shadow-[0_28px_70px_rgba(99,102,241,0.16)] hover:border-indigo-400/40 transition-all duration-300">
                    <p className="text-xs uppercase tracking-[0.2em] text-indigo-300/90 mb-4">{item.step}</p>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/12 border border-indigo-500/25 flex items-center justify-center mb-3">
                      <Icon size={18} className="text-indigo-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                  {index < arr.length - 1 && <ProcessConnector />}
                </Fragment>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section id="stats" ref={statsRef} className="py-20 px-6 md:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-slate-700/50 bg-slate-900/50 backdrop-blur-xl p-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { value: '10K+', target: 10, suffix: 'K+', label: 'Active Students', icon: Users },
                { value: '500K+', target: 500, suffix: 'K+', label: 'Study Sessions', icon: BookOpen },
                { value: '2M+', target: 2, suffix: 'M+', label: 'Hours Tracked', icon: TrendingUp },
                { value: '95%', target: 95, suffix: '%', label: 'Goal Completion', icon: Award },
              ].map(({ value, target, suffix, label, icon: Icon }) => (
                <div key={label} className="stat-item stat-card text-center space-y-2 rounded-2xl border border-slate-700/50 bg-slate-900/35 px-3 py-4 hover:scale-[1.03] hover:border-indigo-400/40 hover:shadow-[0_18px_45px_rgba(99,102,241,0.16)] transition-all duration-300">
                  <div className="stat-icon w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
                    <Icon size={18} className="text-indigo-400" />
                  </div>
                  <p className="stat-value text-3xl font-black gradient-text" data-target={target} data-suffix={suffix}>{value}</p>
                  <p className="text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section id="cta" ref={ctaRef} className="py-24 px-6 md:px-10 relative overflow-hidden">
        <div className="orb w-[600px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600/15" />
        <div className="max-w-3xl mx-auto text-center relative cta-content space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm">
            <Check size={13} />
            Free forever · No credit card needed
          </div>
          <h2 className="text-5xl font-black text-slate-100 leading-tight">
            Ready to transform<br />
            <span className="gradient-text">your study life?</span>
          </h2>
          <p className="text-xl text-slate-400">
            Join thousands of students already tracking their progress and achieving their goals with StudyFlow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="group inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-glow hover:shadow-glow-lg hover:-translate-y-1 transition-all"
            >
              Get started for free
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-10 px-6 md:px-10 border-t border-slate-800/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="text-sm font-bold gradient-text">StudyFlow</span>
          </div>
          <p className="text-sm text-slate-600">
            © 2026 StudyFlow. Built with passion for learners everywhere.
          </p>
          <div className="flex items-center gap-5 text-sm text-slate-600">
            {['Privacy', 'Terms', 'Support'].map(l => (
              <a key={l} href="#" className="hover:text-slate-400 transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
