import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function History() {
  const [data, setData] = useState(null)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    api.getUsage(month).then(setData).catch(e => setError(e.message))
  }, [month])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Crawl History</h1>
          <p className="text-gray-500 text-sm mt-1">Your crawl activity by month</p>
        </div>
        <input
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">{error}</div>}

      {data && (
        <>
          {/* Usage summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Used', value: data.usage.used, color: 'text-orange-600' },
              { label: 'Remaining', value: data.usage.remaining, color: 'text-green-600' },
              { label: 'Limit', value: data.usage.limit, color: 'text-gray-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{label}</p>
                <p className={`text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Crawl list */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="px-5 py-3 border-b bg-gray-50 text-xs text-gray-500 uppercase font-medium">
              Crawl Log — {data.period}
            </div>
            {data.recent_crawls?.length > 0 ? (
              <div className="divide-y">
                {data.recent_crawls.map((c, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${c.status === 'success' ? 'bg-green-500' : 'bg-red-400'}`} />
                    <div className="flex-1 min-w-0">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate block"
                      >
                        {c.url}
                      </a>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0">{c.pages} pages</span>
                    <span className={`text-xs font-medium flex-shrink-0 ${c.status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                      {c.status}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 w-32 text-right">
                      {new Date(c.created_at).toLocaleString('vi-VN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">
                No crawls found for this period
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
