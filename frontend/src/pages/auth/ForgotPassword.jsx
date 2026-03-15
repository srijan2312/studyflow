import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { GraduationCap, Mail, ArrowLeft, Check, AlertCircle, BookOpen, BarChart3 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const pageRef = useRef(null)
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  useGSAP(() => {
    gsap.fromTo(
      '.auth-field',
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: 'power3.out', delay: 0.08 }
    )

    gsap.utils.toArray('.auth-strip-track').forEach((track) => {
      const glow = track.querySelector('.auth-strip-glow')
      if (!glow) return

      const trackWidth = track.clientWidth
      const glowWidth = glow.clientWidth
      const travel = Math.max(trackWidth - glowWidth, 0)

      gsap.set(glow, { x: 0, opacity: 0.05 })

      gsap.to(glow, {
        keyframes: [
          { x: travel * 0.55, opacity: 0.9, duration: 1.55, ease: 'none' },
          { x: travel, opacity: 0.05, duration: 1.25, ease: 'none' },
        ],
        repeat: -1,
      })
    })

    gsap.to('.auth-insight-chip', {
      y: -3,
      duration: 1.8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.12,
    })
  }, { scope: pageRef })

  const validateEmail = (value) => {
    if (!value.trim()) return 'Email is required'
    if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address'
    return ''
  }

  const handleChangeEmail = (e) => {
    const value = e.target.value
    setEmail(value)
    setError('')
    setEmailError(validateEmail(value))
  }

  const handleBlurEmail = (e) => {
    setEmailError(validateEmail(e.target.value))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const nextEmailError = validateEmail(email)
    setEmailError(nextEmailError)
    if (nextEmailError) {
      setError('Please fix the highlighted field')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { error: err } = await resetPassword(email)
      if (err) throw err
      setSent(true)
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-[#020617] flex items-center justify-center px-6 py-12">
      <div className="orb w-[400px] h-[400px] top-0 right-0 bg-indigo-600/15 animate-float" />
      <div className="orb w-[300px] h-[300px] bottom-0 left-0 bg-purple-600/12 animate-float-delay" />

      <div className="relative w-full max-w-sm space-y-8">
        <div className="text-center space-y-3 auth-field">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-glow">
            <GraduationCap size={22} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-100">
            {sent ? 'Check your email' : 'Reset your password'}
          </h1>
          <p className="text-sm text-slate-500">
            {sent
              ? `We've sent a reset link to ${email}`
              : "Enter your email and we'll send you a reset link"
            }
          </p>
        </div>

        <div className="auth-field relative h-20 rounded-2xl border border-slate-700/40 bg-slate-900/35 overflow-hidden">
          <div className="auth-strip-track absolute left-5 right-5 top-1/2 -translate-y-1/2 h-2 overflow-hidden rounded-full">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px rounded-full bg-gradient-to-r from-indigo-500/25 via-purple-500/20 to-cyan-500/25" />
            <div className="auth-strip-glow absolute left-0 top-1/2 -translate-y-1/2 w-16 h-1.5 rounded-full bg-[radial-gradient(circle,rgba(103,232,249,0.9)_0%,rgba(99,102,241,0.35)_50%,rgba(2,6,23,0)_100%)] blur-[1px]" />
          </div>
          <div className="relative z-10 mx-auto h-full flex items-center justify-center gap-8">
            {[BookOpen, BarChart3].map((Icon, idx) => (
              <div key={idx} className="auth-insight-chip w-10 h-10 rounded-xl border border-indigo-500/25 bg-slate-900/80 flex items-center justify-center">
                <Icon size={16} className="text-indigo-300" />
              </div>
            ))}
          </div>
        </div>

        {sent ? (
          <div className="space-y-4 auth-field">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mx-auto">
              <Check size={24} className="text-emerald-400" />
            </div>
            <p className="text-xs text-center text-slate-500">
              Didn't receive the email? Check your spam folder or{' '}
              <button onClick={() => setSent(false)} className="text-indigo-400 hover:text-indigo-300">
                try again
              </button>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="auth-field flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}
            <Input
              className="auth-field"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleChangeEmail}
              onBlur={handleBlurEmail}
              leftIcon={<Mail size={15} />}
              error={emailError}
            />
            <Button type="submit" size="lg" loading={loading} className="w-full auth-field">
              Send reset link
            </Button>
          </form>
        )}

        <div className="text-center auth-field">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
