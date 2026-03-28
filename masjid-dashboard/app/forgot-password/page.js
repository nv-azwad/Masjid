'use client'

import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
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
    <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center px-4" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/icon.png" alt="Gausul Azam Jameh Masjid" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h1 className="text-masjid-gold text-xl font-bold">Gausul Azam Jameh Masjid</h1>
          <p className="text-gray-600 text-sm mt-1">Password Recovery</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-masjid-card rounded-2xl p-8 border border-masjid-border">
          <h2 className="text-white text-lg font-semibold mb-2 text-center">Forgot Password</h2>
          <p className="text-gray-500 text-sm text-center mb-6">Enter your username and we'll send a reset link to your recovery email.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 mb-5 text-green-400 text-sm text-center">
              {message}
            </div>
          )}

          {!message && (
            <>
              <div className="mb-6">
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

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-masjid-green text-masjid-dark py-3 rounded-lg text-sm font-bold transition ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </>
          )}

          <div className="text-center mt-4">
            <a href="/login" className="text-masjid-gold text-xs hover:underline">Back to Login</a>
          </div>
        </form>
      </div>
    </div>
  )
}
