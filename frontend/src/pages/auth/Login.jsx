import { useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { GraduationCap, Mail, ArrowRight, AlertCircle, Chrome, BookOpen, BarChart3, Brain } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Login() {
  const pageRef = useRef(null)
  const [form, setForm] = useState({ email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' })
  const [socialLoading, setSocialLoading] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signInWithProvider } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname ?? '/app'

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

  const validateField = (name, value) => {
    if (name === 'email') {
      if (!value.trim()) return 'Email is required'
      if (!EMAIL_REGEX.test(value.trim())) return 'Enter a valid email address'
      return ''
    }
    if (name === 'password') {
      if (!value) return 'Password is required'
      if (value.length < 6) return 'Password should be at least 6 characters'
      return ''
    }
    return ''
  }

  const updateField = (name) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
    setFieldErrors((prev) => ({ ...prev, [name]: validateField(name, value) }))
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
      email: validateField('email', form.email),
      password: validateField('password', form.password),
    }
    setFieldErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) {
      setError('Please fix the highlighted fields')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { error: authError } = await signIn(form.email, form.password)
      if (authError) throw authError
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message ?? 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={pageRef} className="min-h-screen bg-[#020617] flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex flex-col flex-1 relative overflow-hidden bg-slate-950/50">
        {/* Orbs */}
        <div className="orb w-[400px] h-[400px] top-[-50px] left-[-50px] bg-indigo-600/25 animate-float" />
        <div className="orb w-[300px] h-[300px] bottom-[100px] right-[50px] bg-purple-600/20 animate-float-delay" />

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-12">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-auto">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-glow">
              <GraduationCap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text">StudyFlow</span>
          </Link>

          <div className="mb-auto space-y-10">
            <div className="space-y-4">
              <h2 className="text-4xl xl:text-5xl font-black text-white leading-tight">
                Your learning<br />
                <span className="gradient-text">supercharged.</span>
              </h2>
              <p className="text-slate-400 text-xl max-w-md leading-relaxed">
                Track every session. Master every skill. Hit every goal. All in one place.
              </p>
            </div>

            {/* Feature highlights */}
            <div className="space-y-4">
              {[
                '📊 Visualize weekly study patterns',
                '🔥 Build unbreakable study streaks',
                '🎯 Hit goals with smart tracking',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 text-base text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs">✓</div>
                  {item}
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
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <GraduationCap size={16} className="text-white" />
          </div>
          <span className="font-bold gradient-text">StudyFlow</span>
        </Link>

        <div className="w-full max-w-md space-y-10">
          <div className="space-y-2 auth-field">
            <h1 className="text-2xl font-bold text-slate-100">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to continue your learning journey</p>
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
              placeholder="Enter your password"
              value={form.password}
              onChange={updateField('password')}
              onBlur={blurField('password')}
              autoComplete="current-password"
              error={fieldErrors.password}
            />

            <div className="auth-field flex justify-end">
              <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            <Button
              className="w-full auth-field"
              type="submit"
              size="lg"
              loading={loading}
              rightIcon={<ArrowRight size={16} />}
            >
              Sign in
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

          <p className="auth-field text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Create one free →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
