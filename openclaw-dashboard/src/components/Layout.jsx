import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

const nav = [
  { to: '/', label: 'Overview', icon: '📊' },
  { to: '/customers', label: 'Customers', icon: '👥' },
  { to: '/payments', label: 'Payments', icon: '💳' },
  { to: '/usage', label: 'Usage', icon: '📈' },
  { to: '/revenue', label: 'Revenue', icon: '💰' },
  { to: '/plans', label: 'Plans', icon: '📦' },
  { to: '/actors', label: 'Actors', icon: '🕷️' },
  { to: '/pricing', label: 'Pricing', icon: '🧮' },
]

export default function Layout() {
  const navigate = useNavigate()
  function logout() {
    localStorage.removeItem('adminKey')
    navigate('/login')
  }
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold text-orange-400">OpenClaw</h1>
          <p className="text-xs text-gray-400 mt-1">Admin Dashboard</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                  isActive ? 'bg-orange-500 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`
              }
            >
              <span>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <button onClick={logout} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded">
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
