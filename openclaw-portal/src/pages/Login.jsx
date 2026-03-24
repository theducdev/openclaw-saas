import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [key, setKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    localStorage.setItem('customerKey', key.trim())
    try {
      const res = await fetch('http://localhost:3000/api/v1/plan', {
        headers: { Authorization: `Bearer ${key.trim()}` },
      })
      if (res.ok) {
        navigate('/')
      } else {
        const d = await res.json()
        localStorage.removeItem('customerKey')
        setError(d?.error?.message || 'Invalid API key')
      }
    } catch {
      localStorage.removeItem('customerKey')
      setError('Cannot connect to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🕷️</div>
          <h1 className="text-2xl font-bold">OpenClaw Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Enter your API key to continue</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input
              type="password"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="oc_xxxxxxxxxxxxxxxx"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-mono"
              required
              autoFocus
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Connecting...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-6">
          Don't have an API key? Contact your administrator.
        </p>
      </div>
    </div>
  )
}
