import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Customers() {
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();

  function load(params = {}) {
    api.getCustomers({ search, status, ...params }).then(setData).catch(console.error);
  }

  useEffect(() => { load(); }, [search, status]);

  async function handleDelete(id, name) {
    if (!confirm(`Cancel customer "${name}"?`)) return;
    await api.deleteCustomer(id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Customers</h2>
        <Link to="/customers/add" className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
          + Add Customer
        </Link>
      </div>

      <div className="flex gap-3">
        <input
          placeholder="Search name/email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-1.5 text-sm w-64"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {data && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                {['Name', 'Email', 'Plan', 'Usage', 'Status', 'Expires', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email || '-'}</td>
                  <td className="px-4 py-3">{c.plan_name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={parseInt(c.usage_this_month) >= c.monthly_limit ? 'text-red-600 font-medium' : ''}>
                      {c.usage_this_month}/{c.monthly_limit || 0}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      c.status === 'active' ? 'bg-green-100 text-green-700' :
                      c.status === 'suspended' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {c.plan_expires_at ? new Date(c.plan_expires_at).toLocaleDateString('vi-VN') : '-'}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <Link to={`/customers/${c.id}`} className="text-blue-500 hover:underline">View</Link>
                    <button onClick={() => handleDelete(c.id, c.name)} className="text-red-400 hover:underline">Cancel</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-sm text-gray-500">
            {data.total} customers total
          </div>
        </div>
      )}
    </div>
  );
}
