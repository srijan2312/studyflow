import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import {
  GraduationCap,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Check,
  Chrome,
  BookOpen,
  BarChart3,
  Brain,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function getPasswordStrength(password) {
  if (!password) return { score: 0, label: 'Weak' }
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { score: 1, label: 'Weak' }
  if (score === 2) return { score: 2, label: 'Medium' }
  return { score: 3, label: 'Strong' }
}

export default function Signup() {
  const pageRef = useRef(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState('')
  const [success, setSuccess] = useState(false)
  const { signUp, signInWithProvider } = useAuth()
  const navigate = useNavigate()

  useGSAP(() => {
    gsap.fromTo(
      '.auth-field',
      { opacity: 0, y: 20 },
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

    const dividerGlow = document.querySelector('.divider-glow')
    if (dividerGlow) {
      const dividerHeight = dividerGlow.parentElement?.clientHeight || 0
      gsap.set(dividerGlow, { y: -128 })
      gsap.to(dividerGlow, {
        y: dividerHeight,
        duration: 4,
        ease: 'none',
        repeat: -1,
      })
    }
  }, { scope: pageRef })

  const validateField = (name, value, draft = form) => {
    if (name === 'name') {
      if (!value.trim()) return 'Full name is required'
      if (value.trim().length < 2) return 'Name must be at least 2 characters'
      return ''
    }
    if (name === 'email') {
      if (!value.trim()) return 'Email is required'
      if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address'
      return ''
    }
    if (name === 'password') {
      if (!value) return 'Password is required'
      if (value.length < 6) return 'Password must be at least 6 characters'
      return ''
    }
    if (name === 'confirm') {
      if (!value) return 'Please confirm your password'
      if (value !== draft.password) return 'Passwords do not match'
      return ''
    }
    return ''
  }

  const updateField = (name) => (e) => {
    const value = e.target.value
    setForm((prev) => {
      const next = { ...prev, [name]: value }
      setFieldErrors((prevErrors) => ({
        ...prevErrors,
        [name]: validateField(name, value, next),
        ...(name === 'password' ? { confirm: validateField('confirm', next.confirm, next) } : {}),
      }))
      return next
    })
    setError('')
  }

  const blurField = (name) => (e) => {
    const value = e.target.value
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
  }

  const handleProvider = async (provider) => {
    setError('')
    setSocialLoading(provider)
    const { error: authError } = await signInWithProvider(provider)
    if (authError) {
      setError(authError.message ?? `Unable to continue with ${provider}`)
      setSocialLoading('')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const nextErrors = {
      name: validateField('name', form.name),
      email: validateField('email', form.email),
      password: validateField('password', form.password),
      confirm: validateField('confirm', form.confirm),
    }
    setFieldErrors(nextErrors)
    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.confirm) {
      setError('Please fix the highlighted fields')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { error: authError } = await signUp(form.email, form.password, form.name)
      if (authError) throw authError
      setSuccess(true)
      setTimeout(() => navigate('/app'), 1500)
    } catch (err) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <Check size={28} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-slate-100">Account created!</h2>
          <p className="text-slate-500 text-sm">Redirecting to your dashboard…</p>
        </div>
      </div>
    )
  }

  const passwordStrength = getPasswordStrength(form.password)

  return (
    <div ref={pageRef} className="min-h-screen bg-[#020617] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-slate-950/50">
        <div className="orb w-[400px] h-[400px] top-[-50px] right-[-50px] bg-purple-600/25 animate-float" />
        <div className="orb w-[300px] h-[300px] bottom-[50px] left-[50px] bg-cyan-500/20 animate-float-delay" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          <Link to="/" className="flex items-center gap-2.5 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">StudyFlow</span>
          </Link>

          <div className="mb-auto space-y-10">
            <div className="space-y-3">
              <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
                Start your<br />
                <span className="gradient-text">learning journey.</span>
              </h2>
              <p className="text-slate-400 text-xl max-w-md leading-relaxed">
                Join 10,000+ students who track their progress and achieve their goals with StudyFlow.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { step: '01', title: 'Create your account', desc: 'Set up in under 60 seconds' },
                { step: '02', title: 'Log your first session', desc: 'Track what you study today' },
                { step: '03', title: 'Watch your progress grow', desc: 'Analytics reveal your patterns' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0">
                    {step}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-200">{title}</p>
                    <p className="text-sm text-slate-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative w-[20rem] max-w-full rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-2.5">
              <div className="auth-strip-track absolute left-4 right-4 top-1/2 -translate-y-1/2 h-2 overflow-hidden rounded-full">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px rounded-full bg-gradient-to-r from-indigo-500/25 via-purple-500/20 to-cyan-500/25" />
                <div className="auth-strip-glow absolute left-0 top-1/2 -translate-y-1/2 w-16 h-1.5 rounded-full bg-[radial-gradient(circle,rgba(103,232,249,0.9)_0%,rgba(99,102,241,0.35)_50%,rgba(2,6,23,0)_100%)] blur-[1px]" />
              </div>
              <div className="relative z-10 mx-auto flex items-center justify-between w-full max-w-[12.5rem]">
                {[BookOpen, Brain, BarChart3].map((Icon, idx) => (
                  <div key={idx} className="w-9 h-9 rounded-lg border border-indigo-500/25 bg-slate-900/80 flex items-center justify-center">
                    <Icon size={16} className="text-indigo-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider with animated glow */}
      <div className="hidden lg:flex relative w-px bg-gradient-to-b from-transparent via-indigo-500/40 to-transparent overflow-hidden">
        <div className="divider-glow absolute inset-0 w-full h-32 bg-gradient-to-b from-indigo-500/60 via-purple-500/40 to-transparent blur-lg" />
      </div>

      {/* Right panel — form */}
      <div className="flex-1 lg:max-w-[540px] flex flex-col items-center justify-center px-6 lg:px-10 py-10 lg:py-8">
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-bold gradient-text">StudyFlow</span>
        </Link>

        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2 auth-field">
            <h1 className="text-2xl font-bold text-slate-100">Create your account</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="auth-field flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <Input
              className="auth-field"
              label="Full name"
              type="text"
              placeholder="Alex Chen"
              value={form.name}
              onChange={updateField('name')}
              onBlur={blurField('name')}
              leftIcon={<User size={15} />}
              autoComplete="name"
              error={fieldErrors.name}
            />

            <Input
              className="auth-field"
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField('email')}
              onBlur={blurField('email')}
              leftIcon={<Mail size={15} />}
              autoComplete="email"
              error={fieldErrors.email}
            />

            <Input
              className="auth-field"
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={updateField('password')}
              onBlur={blurField('password')}
              error={fieldErrors.password}
            />

            {form.password && (
              <div className="auth-field -mt-2">
                <p className={`text-sm font-medium ${passwordStrength.score === 1 ? 'text-rose-300' : passwordStrength.score === 2 ? 'text-amber-300' : 'text-emerald-300'}`}>
                  {passwordStrength.label}
                </p>
              </div>
            )}

            <Input
              className="auth-field"
              label="Confirm password"
              type="password"
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={updateField('confirm')}
              onBlur={blurField('confirm')}
              error={fieldErrors.confirm}
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full auth-field"
              rightIcon={<ArrowRight size={16} />}
            >
              Create account
            </Button>

            <div className="auth-field relative flex items-center gap-4 pt-1">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">OR</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            <div className="auth-field grid grid-cols-1 gap-3">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                loading={socialLoading === 'google'}
                leftIcon={<Chrome size={16} />}
                onClick={() => handleProvider('google')}
              >
                Continue with Google
              </Button>
            </div>
          </form>

          <p className="auth-field text-center text-xs text-slate-600">
            By creating an account you agree to our{' '}
            <a href="#" className="text-slate-500 hover:text-slate-300 underline">Terms</a> and{' '}
            <a href="#" className="text-slate-500 hover:text-slate-300 underline">Privacy Policy</a>
          </p>

          <p className="auth-field text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
