import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

function StatCard({ label, value, sub, color = 'text-gray-900' }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-gray-400">Loading...</p>;

  const o = data.overview;
  const profitUsd = (o.revenue_this_month_vnd / 24000 - parseFloat(o.apify_cost_usd_this_month)).toFixed(2);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Overview</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Customers" value={o.active_customers} sub={`${o.total_customers} total`} color="text-green-600" />
        <StatCard label="Revenue (month)" value={`${Number(o.revenue_this_month_vnd).toLocaleString()} ₫`} color="text-blue-600" />
        <StatCard label="Crawls (month)" value={o.total_crawls_this_month} sub={`${o.failed_crawls} failed`} />
        <StatCard label="Apify Cost" value={`$${parseFloat(o.apify_cost_usd_this_month).toFixed(2)}`} sub={`Profit ~$${profitUsd}`} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-3">Top Customers</h3>
          <div className="space-y-2">
            {data.top_customers.map((c) => (
              <div key={c.customer_id} className="flex items-center gap-2">
                <span className="text-sm flex-1">{c.name}</span>
                <span className="text-xs text-gray-500">{c.plan}</span>
                <div className="w-24 bg-gray-100 rounded h-2">
                  <div
                    className="bg-orange-400 h-2 rounded"
                    style={{ width: `${Math.min(100, (c.usage / c.limit_) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-12 text-right">{c.usage}/{c.limit_}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-medium mb-3">Alerts</h3>
          {data.expiring_soon.length === 0 && data.pending_payments.length === 0 && (
            <p className="text-sm text-gray-400">No alerts</p>
          )}
          {data.expiring_soon.map((c) => (
            <div key={c.name} className="text-sm text-yellow-700 bg-yellow-50 rounded p-2 mb-2">
              ⚠️ {c.name} expires in {c.days_left} days
            </div>
          ))}
          {data.pending_payments.map((p, i) => (
            <div key={i} className="text-sm text-red-700 bg-red-50 rounded p-2 mb-2">
              💳 {p.customer}: {Number(p.amount).toLocaleString()} ₫ pending
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
