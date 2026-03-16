import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../../lib/supabase"

export default function ResetPassword() {
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleReset = async (e) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({
      password
    })

    setLoading(false)

    if (!error) {
      alert("Password updated successfully")
      navigate("/login")
    } else {
      alert(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
      <form onSubmit={handleReset} className="space-y-4">
        <h2 className="text-xl font-bold">Set New Password</h2>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          className="p-2 rounded bg-slate-800"
        />

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 rounded"
        >
          Update Password
        </button>
      </form>
    </div>
  )
}
