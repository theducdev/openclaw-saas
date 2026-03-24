import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function AddCustomer() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', plan_id: '', notes: '' });
  const [plans, setPlans] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => { api.getPlans().then((d) => setPlans(d.plans)); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const data = await api.createCustomer(form);
      setResult(data);
    } catch (err) {
      setError(err.message);
    }
  }

  if (result) {
    return (
      <div className="max-w-lg">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="font-semibold text-green-800 mb-3">Customer Created!</h3>
          <p className="text-sm text-green-700 mb-4">{result.warning}</p>
          <div className="bg-white rounded p-3 font-mono text-sm break-all border">
            {result.customer.api_key}
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(result.customer.api_key); }}
            className="mt-3 text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
          >
            Copy Key
          </button>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Name:</strong> {result.customer.name}</p>
            <p><strong>Plan:</strong> {result.customer.plan}</p>
            <p><strong>Expires:</strong> {new Date(result.customer.expires_at).toLocaleDateString('vi-VN')}</p>
          </div>
          <button onClick={() => navigate('/customers')} className="mt-4 text-sm text-blue-500 hover:underline">
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-semibold mb-6">Add Customer</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        {[
          { key: 'name', label: 'Name', required: true },
          { key: 'email', label: 'Email', type: 'email' },
          { key: 'phone', label: 'Phone' },
        ].map(({ key, label, type = 'text', required }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label} {required && '*'}</label>
            <input
              type={type}
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
              className="w-full border rounded px-3 py-2 text-sm"
              required={required}
            />
          </div>
        ))}
        <div>
          <label className="block text-sm font-medium mb-1">Plan</label>
          <select
            value={form.plan_id}
            onChange={(e) => setForm((f) => ({ ...f, plan_id: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="">Select plan...</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {Number(p.price).toLocaleString()} ₫/tháng ({p.monthly_limit} lượt)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded text-sm hover:bg-orange-600">
            Create Customer
          </button>
          <button type="button" onClick={() => navigate('/customers')} className="text-gray-500 px-4 py-2 rounded text-sm hover:bg-gray-100">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
