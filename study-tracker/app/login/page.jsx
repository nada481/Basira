'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const ROLE_TO_PATH = {
  teacher: '/teacher',
  student: '/child',
  parent:  '/parent',
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) throw new Error(signInError.message)

      const meRes  = await fetch('/api/auth/me')
      const meData = await meRes.json()
      if (!meRes.ok) throw new Error(meData.error ?? 'Could not load your account')

      const path = ROLE_TO_PATH[meData.user.role]
      if (!path) throw new Error('No dashboard configured for your role')

      router.push(path)

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <div>
          <h1 className="text-lg font-bold text-[#8B1A4A]">Sign in</h1>
          <p className="text-xs text-gray-400 mt-1">Welcome back to Basira</p>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 block">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#8B1A4A]/20"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-[#8B1A4A] hover:bg-[#a32258] disabled:opacity-60 transition-colors"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}