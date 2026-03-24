import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Plans() {
  const [plans, setPlans] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', monthly_limit: '', max_pages: '10' });

  function load() { api.getPlans().then((d) => setPlans(d.plans)); }
  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    await api.createPlan({ ...form, price: parseInt(form.price), monthly_limit: parseInt(form.monthly_limit), max_pages: parseInt(form.max_pages) });
    setShowAdd(false);
    load();
  }

  async function handleUpdate(id) {
    await api.updatePlan(id, { ...editing, price: parseInt(editing.price), monthly_limit: parseInt(editing.monthly_limit), max_pages: parseInt(editing.max_pages) });
    setEditing(null);
    load();
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plans</h2>
        <button onClick={() => setShowAdd(true)} className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">+ Add Plan</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white rounded-lg shadow p-5 grid grid-cols-2 gap-3 text-sm">
          {[['name', 'Name'], ['price', 'Price (VND)'], ['monthly_limit', 'Monthly Limit'], ['max_pages', 'Max Pages']].map(([k, l]) => (
            <div key={k}>
              <label className="block text-xs text-gray-500 mb-1">{l}</label>
              <input type={k === 'name' ? 'text' : 'number'} value={form[k]} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} className="w-full border rounded px-2 py-1.5" required />
            </div>
          ))}
          <div className="col-span-2 flex gap-2">
            <button type="submit" className="bg-orange-500 text-white px-4 py-1.5 rounded text-sm hover:bg-orange-600">Create</button>
            <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500 px-4 py-1.5 rounded text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {plans.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4">
            {editing?.id === p.id ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['name', 'Name'], ['price', 'Price (VND)'], ['monthly_limit', 'Monthly Limit'], ['max_pages', 'Max Pages']].map(([k, l]) => (
                  <div key={k}>
                    <label className="block text-xs text-gray-500 mb-1">{l}</label>
                    <input type={k === 'name' ? 'text' : 'number'} value={editing[k]} onChange={(e) => setEditing((f) => ({ ...f, [k]: e.target.value }))} className="w-full border rounded px-2 py-1.5" />
                  </div>
                ))}
                <div className="col-span-2 flex items-center gap-3">
                  <button onClick={() => handleUpdate(p.id)} className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600">Save</button>
                  <button onClick={() => setEditing(null)} className="text-gray-500 text-sm">Cancel</button>
                  <label className="flex items-center gap-2 ml-auto text-sm">
                    <input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing((f) => ({ ...f, is_active: e.target.checked }))} />
                    Active
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{p.name}</span>
                  {!p.is_active && <span className="ml-2 text-xs text-gray-400">(inactive)</span>}
                  <p className="text-sm text-gray-500 mt-0.5">
                    {Number(p.price).toLocaleString()} ₫/tháng — {p.monthly_limit} lượt — {p.max_pages} pages/crawl
                  </p>
                </div>
                <button onClick={() => setEditing({ ...p })} className="text-blue-500 text-sm hover:underline">Edit</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
