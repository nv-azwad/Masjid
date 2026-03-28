'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ResetForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="bg-masjid-card rounded-2xl p-8 border border-masjid-border text-center">
        <p className="text-red-400">Invalid reset link. Please request a new one from the login page.</p>
        <a href="/login" className="text-masjid-gold text-sm hover:underline mt-4 inline-block">Back to Login</a>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setMessage(data.message)
      }
    } catch {
      setError('Connection failed. Please try again.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-masjid-card rounded-2xl p-8 border border-masjid-border">
      <h2 className="text-white text-lg font-semibold mb-2 text-center">Set New Password</h2>
      <p className="text-gray-500 text-sm text-center mb-6">Must be at least 8 characters with one uppercase letter and one number.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {message ? (
        <div className="text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-5 text-green-400 text-sm">
            {message}
          </div>
          <a href="/login" className="bg-masjid-green text-masjid-dark px-6 py-3 rounded-lg text-sm font-bold inline-block hover:opacity-90 transition">
            Go to Login
          </a>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-masjid-gold text-xs mb-1.5 font-medium">New Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-masjid-green transition"
              placeholder="Enter new password"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-masjid-green transition"
              placeholder="Confirm new password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-masjid-green text-masjid-dark py-3 rounded-lg text-sm font-bold transition ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </>
      )}
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/icon.png" alt="Gausul Azam Jameh Masjid" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h1 className="text-masjid-gold text-xl font-bold">Gausul Azam Jameh Masjid</h1>
        </div>

        <Suspense fallback={<div className="text-center text-gray-500">Loading...</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  )
}
