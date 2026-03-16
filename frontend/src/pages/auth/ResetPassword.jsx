import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { gsap } from "gsap"
import { useGSAP } from "@gsap/react"
import { Lock, Check, AlertCircle, ArrowLeft } from "lucide-react"
import { supabase } from "../../lib/supabase"
import Input from "../../components/ui/Input"
import Button from "../../components/ui/Button"
import { Link } from "react-router-dom"

export default function ResetPassword() {
  const pageRef = useRef(null)

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const navigate = useNavigate()

  useGSAP(() => {
    gsap.fromTo(
      ".auth-field",
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, stagger: 0.06, ease: "power3.out" }
    )
  }, { scope: pageRef })

  const validate = () => {
    if (!password) return "Password is required"
    if (password.length < 6) return "Password must be at least 6 characters"
    if (password !== confirm) return "Passwords do not match"
    return ""
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validation = validate()
    if (validation) {
      setError(validation)
      return
    }

    setError("")
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    setSuccess(true)

    setTimeout(() => {
      navigate("/login")
    }, 2000)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.4)]">
            <Check size={28} className="text-white" />
          </div>

          <h2 className="text-xl font-bold text-slate-100">
            Password Updated
          </h2>

          <p className="text-slate-500 text-sm">
            Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={pageRef}
      className="min-h-screen bg-[#020617] flex items-center justify-center px-6 py-12"
    >
      {/* background glow */}
      <div className="orb w-[400px] h-[400px] top-0 right-0 bg-indigo-600/15 animate-float" />
      <div className="orb w-[300px] h-[300px] bottom-0 left-0 bg-purple-600/12 animate-float-delay" />

      <div className="relative w-full max-w-sm space-y-8">

        {/* title */}
        <div className="text-center space-y-3 auth-field">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto shadow-glow">
            <Lock size={20} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-100">
            Set New Password
          </h1>

          <p className="text-sm text-slate-500">
            Enter your new password below
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {error && (
            <div className="auth-field flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <Input
            className="auth-field"
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Input
            className="auth-field"
            label="Confirm Password"
            type="password"
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />

          <Button
            type="submit"
            size="lg"
            loading={loading}
            className="w-full auth-field"
          >
            Update Password
          </Button>
        </form>

        {/* back link */}
        <div className="text-center auth-field">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
