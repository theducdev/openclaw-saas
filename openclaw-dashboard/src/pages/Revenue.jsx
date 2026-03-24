import React, { useEffect, useState } from 'react';
import { api } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function Revenue() {
  const [data, setData] = useState(null);

  useEffect(() => { api.getRevenue().then(setData).catch(console.error); }, []);

  if (!data) return <p className="text-gray-400">Loading...</p>;

  const chartData = [...data.revenue].reverse().map((r) => ({
    month: r.month,
    revenue: Math.round(r.revenue_vnd / 1000),
    cost: Math.round(parseFloat(r.apify_cost_usd) * 24),
  }));

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Revenue</h2>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="font-medium mb-4">Revenue vs Apify Cost (thousands VND)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#f97316" name="Revenue (k₫)" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="cost" stroke="#ef4444" name="Cost (k₫)" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>{['Month', 'Revenue (VND)', 'Apify Cost (USD)', 'Profit (est.)'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y">
            {data.revenue.map((r) => {
              const profitUsd = (r.revenue_vnd / 24000 - parseFloat(r.apify_cost_usd)).toFixed(2);
              return (
                <tr key={r.month}>
                  <td className="px-4 py-3 font-medium">{r.month}</td>
                  <td className="px-4 py-3 text-blue-600">{Number(r.revenue_vnd).toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-red-500">${parseFloat(r.apify_cost_usd).toFixed(2)}</td>
                  <td className={`px-4 py-3 font-medium ${parseFloat(profitUsd) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ~${profitUsd}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
