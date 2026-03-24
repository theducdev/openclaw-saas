import React, { useState, useEffect } from 'react'
import { api } from '../api'

const CATEGORY_LABELS = {
  general: '🌐 General Scrapers',
  content: '📄 Content',
  search: '🔍 Search Engines',
  facebook: '📘 Facebook',
  social: '📱 Social Media',
  ecommerce: '🛒 E-Commerce',
  travel: '✈️ Travel',
  professional: '💼 Professional',
}

function ResultTable({ results }) {
  if (!results || results.length === 0) return <p className="text-gray-400 text-sm">No results returned.</p>
  const ignoredKeys = new Set(['pagesFunctionResult', 'depth', 'referrerUrl', '#debug', '#error', '#url'])
  const allKeys = [...new Set(results.flatMap(r => Object.keys(r)))].filter(k => !ignoredKeys.has(k)).slice(0, 8)
  if (allKeys.length === 0) return <JsonView data={results} />
  return (
    <div className="overflow-auto max-h-96 rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 sticky top-0">
          <tr>{allKeys.map(k => <th key={k} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">{k}</th>)}</tr>
        </thead>
        <tbody className="divide-y bg-white">
          {results.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              {allKeys.map(k => {
                const val = row[k]
                const str = val == null ? '' : typeof val === 'object' ? JSON.stringify(val) : String(val)
                const isUrl = str.startsWith('http')
                return (
                  <td key={k} className="px-3 py-2 text-gray-700 max-w-xs">
                    {isUrl
                      ? <a href={str} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline truncate block max-w-xs">{str}</a>
                      : <span className="truncate block max-w-xs" title={str}>{str}</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function JsonView({ data }) {
  return (
    <pre className="text-xs bg-gray-950 text-green-400 p-4 rounded-lg overflow-auto max-h-96 whitespace-pre-wrap">
      {JSON.stringify(data, null, 2)}
    </pre>
  )
}

export default function Crawl() {
  const [actors, setActors] = useState([])
  const [form, setForm] = useState({ url: '', task: '', maxPages: 5, actor_id: 'apify/web-scraper' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [view, setView] = useState('table')

  useEffect(() => {
    api.getActors().then(d => {
      setActors(d.actors || [])
    }).catch(() => {})
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  const selectedActor = actors.find(a => a.actor_id === form.actor_id)

  // Group actors by category
  const grouped = actors.reduce((acc, a) => {
    const cat = a.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const data = await api.crawl({
        url: form.url,
        task: form.task || undefined,
        actor_id: form.actor_id || undefined,
        options: { maxPages: parseInt(form.maxPages) },
      })
      setResult(data)
      setView('table')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(result.data.results, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `crawl-${Date.now()}.json`
    a.click()
  }

  function downloadCsv() {
    const rows = result.data.results
    if (!rows.length) return
    const keys = Object.keys(rows[0])
    const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `crawl-${Date.now()}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Crawl Tester</h1>
        <p className="text-gray-500 text-sm mt-1">Choose an actor and run a live crawl to test the service</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-5">

        {/* Actor selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Actor <span className="text-red-400">*</span>
          </label>
          <select
            value={form.actor_id}
            onChange={e => set('actor_id', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
          >
            {Object.entries(grouped).map(([cat, list]) => (
              <optgroup key={cat} label={CATEGORY_LABELS[cat] || cat}>
                {list.map(a => (
                  <option key={a.actor_id} value={a.actor_id}>
                    {a.icon} {a.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {selectedActor && (
            <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded">{selectedActor.actor_id}</span>
              — {selectedActor.description}
            </p>
          )}
        </div>

        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL <span className="text-red-400">*</span>
            {selectedActor?.category === 'search' && (
              <span className="ml-2 text-xs text-blue-500 font-normal">(Google Search: enter the search query in Task below instead)</span>
            )}
          </label>
          <input
            type="url"
            value={form.url}
            onChange={e => set('url', e.target.value)}
            placeholder={
              selectedActor?.actor_id === 'apify/facebook-posts-scraper'    ? 'https://www.facebook.com/pagename' :
              selectedActor?.actor_id === 'apify/facebook-groups-scraper'   ? 'https://www.facebook.com/groups/groupname' :
              selectedActor?.actor_id === 'apify/facebook-comments-scraper' ? 'https://www.facebook.com/PageName/posts/pfbid0...' :
              selectedActor?.actor_id === 'apify/facebook-ads-scraper'      ? 'https://www.facebook.com/ads/library' :
              selectedActor?.actor_id === 'apify/facebook-marketplace-scraper' ? 'https://www.facebook.com/marketplace' :
              selectedActor?.actor_id === 'apify/facebook-profile-scraper'  ? 'https://www.facebook.com/username' :
              selectedActor?.actor_id === 'apify/facebook-events-scraper'   ? 'https://www.facebook.com/events/...' :
              selectedActor?.actor_id === 'apify/facebook-pages-scraper'    ? 'https://www.facebook.com/pagename' :
              selectedActor?.category === 'social'      ? 'https://www.instagram.com/username/' :
              selectedActor?.category === 'ecommerce'   ? 'https://www.amazon.com/dp/B0...' :
              selectedActor?.category === 'search'      ? 'https://www.google.com' :
              'https://example.com'
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            required
          />
        </div>

        {/* Task */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task / Query
            <span className="text-gray-400 font-normal ml-1">
              {selectedActor?.category === 'search' ? '(search keyword — required for Search actors)' : '(optional — describe what to extract)'}
            </span>
          </label>
          <input
            type="text"
            value={form.task}
            onChange={e => set('task', e.target.value)}
            placeholder={
              selectedActor?.actor_id === 'apify/facebook-ads-scraper'         ? 'e.g. Coca Cola (brand/page name to search)' :
              selectedActor?.actor_id === 'apify/facebook-marketplace-scraper' ? 'e.g. iphone 15 pro (search keyword)' :
              selectedActor?.category === 'facebook' ? 'e.g. Lấy 50 bài viết mới nhất' :
              selectedActor?.category === 'search'   ? 'e.g. nhà hàng hải sản Hà Nội' :
              selectedActor?.category === 'social'   ? 'e.g. Lấy 20 bài viết mới nhất' :
              'e.g. Lấy tên sản phẩm và giá'
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Max pages */}
        <div className="flex gap-4 items-end">
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Pages / Items</label>
            <input
              type="number"
              min={1}
              max={25}
              value={form.maxPages}
              onChange={e => set('maxPages', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <p className="text-xs text-gray-400 mb-3">Higher = more data but slower & uses more quota</p>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 pt-1 border-t">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2 mt-4"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Crawling...
              </>
            ) : <>{selectedActor?.icon || '🕷️'} Start Crawl</>}
          </button>
          {loading && <p className="text-sm text-gray-400 mt-4">May take 30–120 seconds depending on actor...</p>}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4 pb-4 border-b">
            <div className="flex items-center gap-1.5 text-green-600">
              <span className="text-lg">✅</span>
              <span className="font-semibold">Crawl complete</span>
            </div>
            <span className="text-sm text-gray-500">📄 {result.data.pages_crawled} pages crawled</span>
            <span className="text-sm text-gray-500">⏱ {(result.data.crawl_time_ms / 1000).toFixed(1)}s</span>
            <span className="text-sm text-gray-500">📦 {result.data.results.length} results</span>
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="text-gray-400">Quota: {result.usage.used}/{result.usage.limit}</span>
              <span className="text-orange-500 font-medium">({result.usage.remaining} left)</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex rounded-lg border overflow-hidden">
              {['table', 'json'].map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-sm font-medium transition-colors ${view === v ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  {v === 'table' ? '📊 Table' : '{ } JSON'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={downloadJson} className="text-xs border rounded px-3 py-1.5 hover:bg-gray-50 text-gray-600">⬇ JSON</button>
              <button onClick={downloadCsv} className="text-xs border rounded px-3 py-1.5 hover:bg-gray-50 text-gray-600">⬇ CSV</button>
            </div>
          </div>

          {view === 'table' ? <ResultTable results={result.data.results} /> : <JsonView data={result.data.results} />}
        </div>
      )}
    </div>
  )
}
