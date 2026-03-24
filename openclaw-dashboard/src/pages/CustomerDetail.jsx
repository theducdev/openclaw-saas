import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState('');

  function load() {
    Promise.all([api.getCustomer(id), api.getPlans()]).then(([d, p]) => {
      setData(d);
      setPlans(p.plans);
      setForm({ name: d.customer.name, email: d.customer.email || '', phone: d.customer.phone || '', status: d.customer.status, plan_id: d.customer.plan_id || '', notes: d.customer.notes || '' });
    }).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    await api.updateCustomer(id, form);
    setEditing(false);
    load();
  }

  async function handleResetKey() {
    if (!confirm('Generate a new API key? The old key will be invalidated.')) return;
    const res = await api.resetCustomerKey(id);
    setNewKey(res.api_key);
  }

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-gray-400">Loading...</p>;

  const c = data.customer;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/customers')} className="text-gray-400 hover:text-gray-600">← Back</button>
        <h2 className="text-xl font-semibold">{c.name}</h2>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {c.status}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">Customer Info</h3>
          <button onClick={() => setEditing(!editing)} className="text-sm text-blue-500 hover:underline">
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <div className="space-y-3">
            {[{ k: 'name', l: 'Name' }, { k: 'email', l: 'Email' }, { k: 'phone', l: 'Phone' }].map(({ k, l }) => (
              <div key={k} className="flex gap-3 items-center">
                <label className="w-20 text-sm text-gray-500">{l}</label>
                <input value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className="flex-1 border rounded px-2 py-1 text-sm" />
              </div>
            ))}
            <div className="flex gap-3 items-center">
              <label className="w-20 text-sm text-gray-500">Status</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="border rounded px-2 py-1 text-sm">
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex gap-3 items-center">
              <label className="w-20 text-sm text-gray-500">Plan</label>
              <select value={form.plan_id} onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))} className="border rounded px-2 py-1 text-sm">
                <option value="">None</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 items-center">
              <label className="w-20 text-sm text-gray-500">Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="flex-1 border rounded px-2 py-1 text-sm" rows={2} />
            </div>
            <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-600">Save</button>
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {[['Email', c.email], ['Phone', c.phone], ['Plan', c.plan_name], ['Expires', c.plan_expires_at ? new Date(c.plan_expires_at).toLocaleDateString('vi-VN') : '-'], ['Notes', c.notes], ['Key Prefix', c.api_key_prefix]].map(([k, v]) => (
              <div key={k}><dt className="text-gray-500">{k}</dt><dd className="font-medium">{v || '-'}</dd></div>
            ))}
          </dl>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">API Key</h3>
          <button onClick={handleResetKey} className="text-sm text-red-500 hover:underline">Reset Key</button>
        </div>
        {newKey ? (
          <div>
            <p className="text-sm text-yellow-700 bg-yellow-50 rounded p-2 mb-2">New key — copy now, won't be shown again</p>
            <div className="font-mono text-sm bg-gray-50 border rounded p-3 break-all">{newKey}</div>
            <button onClick={() => navigator.clipboard.writeText(newKey)} className="mt-2 text-sm bg-gray-200 px-3 py-1 rounded hover:bg-gray-300">Copy</button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Prefix: <code className="bg-gray-100 px-1 rounded">{c.api_key_prefix}...</code></p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h3 className="font-medium mb-3">Recent Crawls</h3>
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-500 uppercase border-b">
            <tr><th className="pb-2 text-left">URL</th><th className="pb-2 text-left">Pages</th><th className="pb-2 text-left">Status</th><th className="pb-2 text-left">Time</th></tr>
          </thead>
          <tbody className="divide-y">
            {data.usage_logs.map((l) => (
              <tr key={l.created_at}>
                <td className="py-2 truncate max-w-xs">{l.request_url}</td>
                <td className="py-2">{l.pages_crawled}</td>
                <td className="py-2">
                  <span className={l.response_status === 200 ? 'text-green-600' : 'text-red-500'}>{l.response_status === 200 ? 'OK' : 'Error'}</span>
                </td>
                <td className="py-2 text-gray-400">{new Date(l.created_at).toLocaleString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
