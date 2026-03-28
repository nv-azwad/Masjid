'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        setLoading(false)
        return
      }

      router.push('/')
    } catch {
      setError('Connection failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/icon.png" alt="Gausul Azam Jameh Masjid" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h1 className="text-masjid-gold text-xl font-bold">Gausul Azam Jameh Masjid</h1>
          <p className="text-gray-600 text-sm mt-1">Admin Dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-masjid-card rounded-2xl p-8 border border-masjid-border">
          <h2 className="text-white text-lg font-semibold mb-6 text-center">Sign In</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-masjid-green transition"
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-masjid-green transition"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-masjid-green text-masjid-dark py-3 rounded-lg text-sm font-bold transition ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center mt-4">
            <a href="/forgot-password" className="text-masjid-gold text-xs hover:underline">Forgot Password?</a>
          </div>
        </form>

        <p className="text-gray-700 text-[0.6rem] text-center mt-6">&copy; 2026 Gausul Azam Jameh Masjid</p>
        <p className="text-masjid-gold text-[0.55rem] text-center mt-1 font-semibold">Powered by Trinovent Tech</p>
      </div>
    </div>
  )
}
