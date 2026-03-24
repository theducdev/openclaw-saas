import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

function QuotaBar({ used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
  const color = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-yellow-400' : 'bg-green-500'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-medium">{used} used</span>
        <span className="text-gray-500">{limit} total</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-gray-500 text-right">{limit - used} remaining</p>
    </div>
  )
}

export default function Dashboard() {
  const [plan, setPlan] = useState(null)
  const [usage, setUsage] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getPlan(), api.getUsage()])
      .then(([p, u]) => { setPlan(p); setUsage(u) })
      .catch(e => setError(e.message))
  }, [])

  if (error) return <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">{error}</div>
  if (!plan || !usage) return <div className="text-gray-400 text-sm">Loading...</div>

  const periodLabel = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
  const daysLeft = plan.expires_at
    ? Math.max(0, Math.ceil((new Date(plan.expires_at) - new Date()) / 86400000))
    : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {usage.customer}</h1>
        <p className="text-gray-500 text-sm mt-1">{periodLabel}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plan card */}
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">Current Plan</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {plan.status}
            </span>
          </div>
          <p className="text-2xl font-bold text-orange-500">{plan.plan}</p>
          <p className="text-sm text-gray-600">{Number(plan.price).toLocaleString()} ₫/tháng</p>
          {daysLeft !== null && (
            <p className={`text-xs font-medium ${daysLeft <= 5 ? 'text-red-600' : 'text-gray-500'}`}>
              {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
            </p>
          )}
        </div>

        {/* Quota card */}
        <div className="bg-white rounded-xl border p-5 space-y-3">
          <span className="text-sm text-gray-500 font-medium">Crawl Quota</span>
          <QuotaBar used={usage.usage.used} limit={usage.usage.limit} />
          <p className="text-xs text-gray-400">Max {plan.max_pages_per_crawl} pages/crawl</p>
        </div>

        {/* Quick crawl CTA */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 flex flex-col justify-between text-white">
          <div>
            <p className="font-semibold text-lg">Ready to crawl?</p>
            <p className="text-orange-100 text-sm mt-1">Test a URL directly in your browser</p>
          </div>
          <Link
            to="/crawl"
            className="mt-4 inline-block bg-white text-orange-600 font-medium text-sm px-4 py-2 rounded-lg hover:bg-orange-50 transition-colors text-center"
          >
            Start Crawling →
          </Link>
        </div>
      </div>

      {/* Recent crawls */}
      {usage.recent_crawls?.length > 0 && (
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Crawls</h2>
            <Link to="/history" className="text-sm text-orange-500 hover:underline">View all →</Link>
          </div>
          <div className="divide-y">
            {usage.recent_crawls.slice(0, 5).map((c, i) => (
              <div key={i} className="py-3 flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status === 'success' ? 'bg-green-500' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-700 truncate flex-1">{c.url}</span>
                <span className="text-xs text-gray-400 flex-shrink-0">{c.pages} pages</span>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(c.created_at).toLocaleString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
