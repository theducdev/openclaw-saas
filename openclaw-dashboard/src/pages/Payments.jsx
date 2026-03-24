import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Payments() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [customers, setCustomers] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customer_id: '', amount: '', payment_method: 'bank_transfer', period_start: '', period_end: '', notes: '', transaction_ref: '' });

  function load() {
    api.getPayments({ status }).then(setData);
    api.getCustomers({ limit: 100 }).then((d) => setCustomers(d.customers));
  }

  useEffect(() => { load(); }, [status]);

  async function confirm(id) {
    await api.updatePayment(id, { status: 'confirmed', confirmed_by: 'admin' });
    load();
  }

  async function handleAdd(e) {
    e.preventDefault();
    await api.createPayment({ ...form, amount: parseInt(form.amount) });
    setShowAdd(false);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Payments</h2>
        <button onClick={() => setShowAdd(true)} className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">+ Add Payment</button>
      </div>

      <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1.5 text-sm">
        <option value="">All</option>
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="failed">Failed</option>
      </select>

      {showAdd && (
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-medium mb-4">New Payment</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Customer</label>
              <select value={form.customer_id} onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))} className="w-full border rounded px-2 py-1.5" required>
                <option value="">Select...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Amount (VND)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="w-full border rounded px-2 py-1.5" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Method</label>
              <select value={form.payment_method} onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))} className="w-full border rounded px-2 py-1.5">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="momo">MoMo</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Transaction Ref</label>
              <input value={form.transaction_ref} onChange={(e) => setForm((f) => ({ ...f, transaction_ref: e.target.value }))} className="w-full border rounded px-2 py-1.5" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Period Start</label>
              <input type="date" value={form.period_start} onChange={(e) => setForm((f) => ({ ...f, period_start: e.target.value }))} className="w-full border rounded px-2 py-1.5" required />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Period End</label>
              <input type="date" value={form.period_end} onChange={(e) => setForm((f) => ({ ...f, period_end: e.target.value }))} className="w-full border rounded px-2 py-1.5" required />
            </div>
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="bg-orange-500 text-white px-4 py-1.5 rounded text-sm hover:bg-orange-600">Save</button>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-500 px-4 py-1.5 rounded text-sm hover:bg-gray-100">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {data && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>{['Customer', 'Amount', 'Method', 'Period', 'Ref', 'Status', 'Date', 'Actions'].map((h) => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {data.payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{p.customer_name}</td>
                  <td className="px-4 py-3 font-medium">{Number(p.amount).toLocaleString()} ₫</td>
                  <td className="px-4 py-3 text-gray-500">{p.payment_method}</td>
                  <td className="px-4 py-3 text-gray-500">{p.period_start} → {p.period_end}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.transaction_ref || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${p.status === 'confirmed' ? 'bg-green-100 text-green-700' : p.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{new Date(p.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    {p.status === 'pending' && (
                      <button onClick={() => confirm(p.id)} className="text-green-600 hover:underline text-xs">Confirm</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
