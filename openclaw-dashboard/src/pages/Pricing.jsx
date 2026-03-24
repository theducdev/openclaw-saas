import React, { useEffect, useState } from 'react'
import { api } from '../api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, LineChart, Line, PieChart, Pie, Cell,
} from 'recharts'

// ─── Apify pricing constants ──────────────────────────────────────────────────
const APIFY_PLAN = { name: 'Scale', monthly: 199, pricePerCU: 0.25 }
const USD_TO_VND = 25000

// Estimated CU per single crawl run (memory × duration)
// + PPR (Pay-Per-Result) surcharge for marketplace actors
const ACTOR_COSTS = [
  { actor: 'apify/cheerio-scraper',          label: 'Cheerio Scraper',          memory: 512,  duration: 0.35, ppr: 0,      category: 'general'  },
  { actor: 'apify/web-scraper',              label: 'Web Scraper',              memory: 1024, duration: 1.2,  ppr: 0,      category: 'general'  },
  { actor: 'apify/puppeteer-scraper',        label: 'Puppeteer Scraper',        memory: 1024, duration: 2.5,  ppr: 0,      category: 'general'  },
  { actor: 'apify/instagram-scraper',        label: 'Instagram Scraper',        memory: 1024, duration: 1.8,  ppr: 0.002,  category: 'social'   },
  { actor: 'apidojo/tweet-scraper',          label: 'Twitter / X Scraper',      memory: 1024, duration: 2.0,  ppr: 0.003,  category: 'social'   },
  { actor: 'streamers/youtube-scraper',      label: 'YouTube Scraper',          memory: 1024, duration: 3.5,  ppr: 0.002,  category: 'social'   },
  { actor: 'apify/facebook-pages-scraper',   label: 'FB Pages Scraper',         memory: 1024, duration: 1.5,  ppr: 0,      category: 'facebook' },
  { actor: 'apify/facebook-posts-scraper',   label: 'FB Posts Scraper',         memory: 4096, duration: 2.0,  ppr: 0.002,  category: 'facebook' },
  { actor: 'apify/facebook-groups-scraper',  label: 'FB Groups Scraper',        memory: 4096, duration: 2.5,  ppr: 0.002,  category: 'facebook' },
  { actor: 'apify/facebook-comments-scraper',label: 'FB Comments Scraper',      memory: 4096, duration: 2.0,  ppr: 0.002,  category: 'facebook' },
  { actor: 'voyager/booking-scraper',        label: 'Booking.com Scraper',      memory: 1024, duration: 2.5,  ppr: 0.003,  category: 'travel'   },
  { actor: 'maxcopell/tripadvisor',          label: 'TripAdvisor Scraper',      memory: 1024, duration: 2.0,  ppr: 0.003,  category: 'travel'   },
]

// CU = memory(MB) / 1024 * duration(min) / 60
function calcCU(memory, durationMin) {
  return (memory / 1024) * (durationMin / 60)
}

// Cost per single crawl run in USD
function costPerCrawl(actor) {
  const cu = calcCU(actor.memory, actor.duration)
  const cuCost = cu * APIFY_PLAN.pricePerCU
  const pprCost = actor.ppr * 20  // assume avg 20 results per crawl
  return cuCost + pprCost
}

// ─── Plans ────────────────────────────────────────────────────────────────────
const PLANS = [
  { name: 'Starter', price: 50000,  limit: 50,  maxPages: 5  },
  { name: 'Basic',   price: 100000, limit: 150, maxPages: 10 },
  { name: 'Pro',     price: 250000, limit: 500, maxPages: 25 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('vi-VN')
const usd = (n) => `$${Number(n).toFixed(4)}`
const vnd = (n) => `${fmt(Math.round(n))} ₫`
const pct = (a, b) => b ? `${((a / b) * 100).toFixed(1)}%` : '—'

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#f59e0b']

// ─── Component ───────────────────────────────────────────────────────────────
export default function Pricing() {
  const [realData, setRealData] = useState(null)
  const [proj, setProj] = useState({
    starter: 5, basic: 10, pro: 3,
    actorMix: 'web-scraper',   // which actor cost to use for projection
    crawlsUsedPct: 70,         // % of quota actually used
  })

  useEffect(() => {
    Promise.all([api.getDashboard(), api.getRevenue()])
      .then(([dash, rev]) => setRealData({ dash, rev }))
      .catch(console.error)
  }, [])

  // ── Projection math ─────────────────────────────────────────────────────────
  const selectedActor = ACTOR_COSTS.find(a => a.actor.includes(proj.actorMix)) || ACTOR_COSTS[1]
  const cpCrawl = costPerCrawl(selectedActor)   // USD per crawl

  const projPlans = PLANS.map(p => {
    const customers = proj[p.name.toLowerCase()]
    const revenueVND = customers * p.price
    const revenueUSD = revenueVND / USD_TO_VND
    const crawlsPerMonth = Math.round(p.limit * (proj.crawlsUsedPct / 100))
    const apifyCostUSD = customers * crawlsPerMonth * cpCrawl
    const profitUSD = revenueUSD - apifyCostUSD - (customers > 0 ? APIFY_PLAN.monthly / (proj.starter + proj.basic + proj.pro || 1) : 0)
    const margin = revenueUSD > 0 ? ((revenueUSD - apifyCostUSD) / revenueUSD) * 100 : 0
    return { ...p, customers, revenueVND, revenueUSD, crawlsPerMonth, apifyCostUSD, profitUSD, margin }
  })

  const totalRevVND = projPlans.reduce((s, p) => s + p.revenueVND, 0)
  const totalRevUSD = totalRevVND / USD_TO_VND
  const totalApifyUSD = projPlans.reduce((s, p) => s + p.apifyCostUSD, 0) + APIFY_PLAN.monthly
  const totalProfitUSD = totalRevUSD - totalApifyUSD
  const totalMargin = totalRevUSD > 0 ? (totalProfitUSD / totalRevUSD) * 100 : 0
  const totalCrawls = projPlans.reduce((s, p) => s + p.customers * p.crawlsPerMonth, 0)

  const projChartData = projPlans.map(p => ({
    name: p.name,
    Revenue: +(p.revenueUSD.toFixed(2)),
    'Apify Cost': +(p.apifyCostUSD.toFixed(2)),
    Profit: +(Math.max(0, p.revenueUSD - p.apifyCostUSD).toFixed(2)),
  }))

  // Break-even: how many customers needed per plan to cover Apify monthly fee
  const breakEvenData = PLANS.map(p => {
    const revenuePerCust = p.price / USD_TO_VND
    const costPerCust = Math.round(p.limit * (proj.crawlsUsedPct / 100)) * cpCrawl
    const profitPerCust = revenuePerCust - costPerCust
    const breakEven = profitPerCust > 0 ? Math.ceil(APIFY_PLAN.monthly / profitPerCust) : Infinity
    return { plan: p.name, revenuePerCust, costPerCust, profitPerCust, breakEven }
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold">Pricing Calculator</h2>
        <p className="text-gray-500 text-sm mt-1">Apify cost vs your pricing — revenue, profit & break-even analysis</p>
      </div>

      {/* ── Apify Plan Info ─────────────────────────────────────────────────── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-blue-600 font-medium uppercase">Apify Plan</p>
            <p className="text-2xl font-bold text-blue-800">{APIFY_PLAN.name}</p>
          </div>
          <div className="h-10 w-px bg-blue-200" />
          <div><p className="text-xs text-blue-600">Monthly fee</p><p className="font-bold text-blue-800">${APIFY_PLAN.monthly}/mo</p></div>
          <div><p className="text-xs text-blue-600">Price per CU</p><p className="font-bold text-blue-800">${APIFY_PLAN.pricePerCU}/CU</p></div>
          <div><p className="text-xs text-blue-600">Exchange rate</p><p className="font-bold text-blue-800">1 USD = {fmt(USD_TO_VND)} ₫</p></div>
          <div className="ml-auto text-xs text-blue-500">CU = Memory(MB)/1024 × Duration(min)/60</div>
        </div>
      </div>

      {/* ── Real data from DB ───────────────────────────────────────────────── */}
      {realData && (
        <div>
          <h3 className="font-semibold mb-3">📊 Actual This Month</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Revenue', value: vnd(realData.dash.overview.revenue_this_month_vnd), sub: `~$${(realData.dash.overview.revenue_this_month_vnd / USD_TO_VND).toFixed(2)}`, color: 'text-green-600' },
              { label: 'Apify Cost', value: `$${parseFloat(realData.dash.overview.apify_cost_usd_this_month).toFixed(4)}`, sub: vnd(realData.dash.overview.apify_cost_usd_this_month * USD_TO_VND), color: 'text-red-500' },
              { label: 'Total Crawls', value: realData.dash.overview.total_crawls_this_month, sub: `${realData.dash.overview.successful_crawls} success`, color: 'text-blue-600' },
              { label: 'Est. Profit', value: `$${((realData.dash.overview.revenue_this_month_vnd / USD_TO_VND) - parseFloat(realData.dash.overview.apify_cost_usd_this_month) - APIFY_PLAN.monthly).toFixed(2)}`, sub: 'after Apify fee', color: 'text-orange-600' },
            ].map(c => (
              <div key={c.label} className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Actor Cost Table ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold mb-3">💸 Apify Cost per Crawl by Actor</h3>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Actor', 'Memory', 'Est. Duration', 'CU/run', 'CU Cost', 'PPR fee', 'Total/crawl', 'Total/crawl (₫)'].map(h => (
                  <th key={h} className="px-3 py-2 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {ACTOR_COSTS.map(a => {
                const cu = calcCU(a.memory, a.duration)
                const cuCost = cu * APIFY_PLAN.pricePerCU
                const pprCost = a.ppr * 20
                const total = cuCost + pprCost
                return (
                  <tr key={a.actor} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium">{a.label}</td>
                    <td className="px-3 py-2 text-gray-500">{a.memory} MB</td>
                    <td className="px-3 py-2 text-gray-500">{a.duration} min</td>
                    <td className="px-3 py-2 font-mono text-xs">{cu.toFixed(4)}</td>
                    <td className="px-3 py-2 text-blue-600">${cuCost.toFixed(5)}</td>
                    <td className="px-3 py-2 text-purple-500">{a.ppr > 0 ? `$${pprCost.toFixed(4)}` : '—'}</td>
                    <td className="px-3 py-2 font-bold text-red-600">${total.toFixed(5)}</td>
                    <td className="px-3 py-2 text-gray-600">{fmt(Math.round(total * USD_TO_VND))} ₫</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-2">* PPR = Pay-Per-Result fee (charged by actor publisher, ~20 results/run assumed). CU cost based on Apify Scale plan ($0.25/CU).</p>
      </div>

      {/* ── Plan Profitability per-crawl ────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold mb-3">📦 Your Plans — Revenue vs Cost per Crawl</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(p => {
            const pricePerCrawl = p.price / p.limit           // VND per crawl charged to customer
            const pricePerCrawlUSD = pricePerCrawl / USD_TO_VND
            const actorCosts = ACTOR_COSTS.map(a => {
              const cost = costPerCrawl(a)
              const margin = ((pricePerCrawlUSD - cost) / pricePerCrawlUSD) * 100
              return { label: a.label, cost, margin }
            }).sort((a, b) => b.margin - a.margin)
            const minMargin = Math.min(...actorCosts.map(a => a.margin))
            const maxMargin = Math.max(...actorCosts.map(a => a.margin))

            return (
              <div key={p.name} className="bg-white rounded-xl border p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-lg">{p.name}</p>
                    <p className="text-sm text-gray-500">{fmt(p.price)} ₫/mo · {p.limit} crawls</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Price/crawl</p>
                    <p className="font-bold text-orange-600">{fmt(pricePerCrawl)} ₫</p>
                    <p className="text-xs text-gray-400">${pricePerCrawlUSD.toFixed(4)}</p>
                  </div>
                </div>
                <div className="space-y-1.5 mt-4">
                  <p className="text-xs font-medium text-gray-500 uppercase">Margin by actor</p>
                  {actorCosts.slice(0, 5).map(a => (
                    <div key={a.label} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-36 truncate">{a.label}</span>
                      <div className="flex-1 bg-gray-100 rounded h-1.5">
                        <div
                          className={`h-1.5 rounded ${a.margin >= 70 ? 'bg-green-500' : a.margin >= 40 ? 'bg-yellow-400' : 'bg-red-400'}`}
                          style={{ width: `${Math.max(0, Math.min(100, a.margin))}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-12 text-right ${a.margin >= 70 ? 'text-green-600' : a.margin >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                        {a.margin.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t flex justify-between text-xs">
                  <span className="text-gray-400">Best margin: <span className="text-green-600 font-medium">{maxMargin.toFixed(0)}%</span></span>
                  <span className="text-gray-400">Worst: <span className={`font-medium ${minMargin < 0 ? 'text-red-500' : 'text-yellow-600'}`}>{minMargin.toFixed(0)}%</span></span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Interactive Projection Calculator ──────────────────────────────── */}
      <div>
        <h3 className="font-semibold mb-3">🧮 Revenue Projection Calculator</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Controls */}
          <div className="bg-white rounded-xl border p-5 space-y-5">
            <p className="font-medium text-sm text-gray-700">Configure Scenario</p>

            {PLANS.map(p => (
              <div key={p.name}>
                <div className="flex justify-between mb-1">
                  <label className="text-sm font-medium">{p.name} customers</label>
                  <span className="text-sm font-bold text-orange-600">{proj[p.name.toLowerCase()]}</span>
                </div>
                <input type="range" min={0} max={50} value={proj[p.name.toLowerCase()]}
                  onChange={e => setProj(f => ({ ...f, [p.name.toLowerCase()]: +e.target.value }))}
                  className="w-full accent-orange-500" />
                <p className="text-xs text-gray-400">{fmt(p.price)} ₫/mo · {p.limit} crawls/mo</p>
              </div>
            ))}

            <div>
              <div className="flex justify-between mb-1">
                <label className="text-sm font-medium">Quota used</label>
                <span className="text-sm font-bold text-orange-600">{proj.crawlsUsedPct}%</span>
              </div>
              <input type="range" min={10} max={100} step={5} value={proj.crawlsUsedPct}
                onChange={e => setProj(f => ({ ...f, crawlsUsedPct: +e.target.value }))}
                className="w-full accent-orange-500" />
              <p className="text-xs text-gray-400">% of monthly quota actually used by customers</p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1">Actor used (for cost estimate)</label>
              <select value={proj.actorMix}
                onChange={e => setProj(f => ({ ...f, actorMix: e.target.value }))}
                className="w-full border rounded px-2 py-1.5 text-sm">
                {ACTOR_COSTS.map(a => (
                  <option key={a.actor} value={a.actor.split('/')[1]}>{a.label} (${costPerCrawl(a).toFixed(5)}/crawl)</option>
                ))}
              </select>
            </div>
          </div>

          {/* Summary cards */}
          <div className="space-y-3">
            {[
              { label: 'Total Revenue',     value: vnd(totalRevVND),                     sub: `~$${totalRevUSD.toFixed(2)}`,           color: 'bg-green-50 border-green-200 text-green-700' },
              { label: 'Apify Cost (est.)', value: `$${totalApifyUSD.toFixed(2)}`,        sub: `${vnd(totalApifyUSD * USD_TO_VND)} incl. $${APIFY_PLAN.monthly} plan fee`, color: 'bg-red-50 border-red-200 text-red-700' },
              { label: 'Net Profit',        value: `$${totalProfitUSD.toFixed(2)}`,       sub: vnd(totalProfitUSD * USD_TO_VND),        color: totalProfitUSD >= 0 ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700' },
              { label: 'Profit Margin',     value: `${totalMargin.toFixed(1)}%`,          sub: `${totalCrawls.toLocaleString()} crawls/mo`, color: 'bg-blue-50 border-blue-200 text-blue-700' },
            ].map(c => (
              <div key={c.label} className={`rounded-xl border p-4 ${c.color}`}>
                <p className="text-xs font-medium opacity-70">{c.label}</p>
                <p className="text-2xl font-bold mt-0.5">{c.value}</p>
                <p className="text-xs opacity-60 mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="bg-white rounded-xl border p-5">
            <p className="font-medium text-sm mb-3">Revenue vs Cost by Plan ($)</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={projChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => `$${v}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Revenue"    fill="#10b981" radius={[3,3,0,0]} />
                <Bar dataKey="Apify Cost" fill="#ef4444" radius={[3,3,0,0]} />
                <Bar dataKey="Profit"     fill="#f97316" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Break-even Analysis ─────────────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold mb-3">📉 Break-even Analysis</h3>
        <p className="text-xs text-gray-500 mb-3">How many customers per plan needed to cover Apify's ${APIFY_PLAN.monthly}/mo plan fee (using <strong>{selectedActor.label}</strong>)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {breakEvenData.map(b => (
            <div key={b.plan} className="bg-white rounded-xl border p-5">
              <p className="font-bold text-lg mb-2">{b.plan}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Revenue/customer</span><span className="text-green-600 font-medium">${b.revenuePerCust.toFixed(4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Apify cost/customer</span><span className="text-red-500 font-medium">${b.costPerCust.toFixed(4)}</span></div>
                <div className="flex justify-between border-t pt-2"><span className="text-gray-500">Net/customer</span><span className={`font-bold ${b.profitPerCust > 0 ? 'text-orange-600' : 'text-red-600'}`}>${b.profitPerCust.toFixed(4)}</span></div>
                <div className="flex justify-between bg-gray-50 rounded px-2 py-1.5">
                  <span className="font-medium">Break-even</span>
                  <span className={`font-bold text-lg ${b.breakEven <= 10 ? 'text-green-600' : b.breakEven <= 30 ? 'text-yellow-600' : 'text-red-500'}`}>
                    {b.breakEven === Infinity ? '∞' : `${b.breakEven} customers`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Detailed per-plan table ──────────────────────────────────────────── */}
      <div>
        <h3 className="font-semibold mb-3">📋 Projection Detail</h3>
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>{['Plan', 'Customers', 'Revenue (₫)', 'Revenue ($)', 'Crawls/mo', 'Apify Cost ($)', 'Gross Profit ($)', 'Margin'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {projPlans.map(p => (
                <tr key={p.name} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.customers}</td>
                  <td className="px-4 py-3 text-green-600">{fmt(p.revenueVND)}</td>
                  <td className="px-4 py-3 text-green-600">${p.revenueUSD.toFixed(2)}</td>
                  <td className="px-4 py-3">{(p.customers * p.crawlsPerMonth).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">${p.apifyCostUSD.toFixed(4)}</td>
                  <td className="px-4 py-3 font-bold text-orange-600">${(p.revenueUSD - p.apifyCostUSD).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.margin >= 80 ? 'bg-green-100 text-green-700' : p.margin >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {p.margin.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold">
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3">{proj.starter + proj.basic + proj.pro}</td>
                <td className="px-4 py-3 text-green-600">{fmt(totalRevVND)}</td>
                <td className="px-4 py-3 text-green-600">${totalRevUSD.toFixed(2)}</td>
                <td className="px-4 py-3">{totalCrawls.toLocaleString()}</td>
                <td className="px-4 py-3 text-red-500">${totalApifyUSD.toFixed(2)} <span className="text-xs font-normal">(+${APIFY_PLAN.monthly} plan)</span></td>
                <td className={`px-4 py-3 ${totalProfitUSD >= 0 ? 'text-orange-600' : 'text-red-600'}`}>${totalProfitUSD.toFixed(2)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${totalMargin >= 80 ? 'bg-green-100 text-green-700' : totalMargin >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {totalMargin.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
