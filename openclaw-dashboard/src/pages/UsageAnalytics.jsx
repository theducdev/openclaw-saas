import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function UsageAnalytics() {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    api.getUsage({ month }).then(setData).catch(console.error);
  }, [month]);

  if (!data) return <p className="text-gray-400">Loading...</p>;

  const chartData = data.usage.slice(0, 10).map((u) => ({
    name: u.customer.split(' ').slice(-1)[0],
    used: parseInt(u.successful),
    limit: parseInt(u.limit_) || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-semibold">Usage Analytics</h2>
        <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded px-3 py-1.5 text-sm" />
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="font-medium mb-4">Top Customers — {month}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="used" fill="#f97316" name="Used" />
            <Bar dataKey="limit" fill="#e5e7eb" name="Limit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>{['Customer', 'Successful', 'Failed', 'Total', 'Limit', '% Used', 'Cost (USD)'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {data.usage.map((u) => {
              const pct = u.limit_ ? Math.round((u.successful / u.limit_) * 100) : 0;
              return (
                <tr key={u.customer_id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.customer}</td>
                  <td className="px-4 py-3 text-green-600">{u.successful}</td>
                  <td className="px-4 py-3 text-red-500">{u.failed}</td>
                  <td className="px-4 py-3">{u.total}</td>
                  <td className="px-4 py-3 text-gray-500">{u.limit_ || '∞'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded h-1.5">
                        <div className={`h-1.5 rounded ${pct >= 90 ? 'bg-red-500' : 'bg-orange-400'}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-xs">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">${parseFloat(u.cost_usd).toFixed(4)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
