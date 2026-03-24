import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export default function Login() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    localStorage.setItem('adminKey', key);
    try {
      const res = await fetch(`${BASE_URL}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${key}` },
      });
      if (res.ok) {
        navigate('/');
      } else {
        localStorage.removeItem('adminKey');
        setError('Invalid admin key');
      }
    } catch {
      localStorage.removeItem('adminKey');
      setError('Connection failed');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">OpenClaw</h1>
        <p className="text-gray-500 text-center text-sm mb-6">Admin Dashboard</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="oc_admin_..."
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-orange-500 text-white py-2 rounded font-medium hover:bg-orange-600 transition">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
