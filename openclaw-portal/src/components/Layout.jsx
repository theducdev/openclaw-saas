import React from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  function logout() {
    localStorage.removeItem('customerKey')
    navigate('/login')
  }
  const linkClass = ({ isActive }) =>
    `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'bg-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'
    }`
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-orange-500">OpenClaw</span>
          <nav className="flex gap-1">
            <NavLink to="/" end className={linkClass}>📊 Dashboard</NavLink>
            <NavLink to="/crawl" className={linkClass}>🕷️ Crawl</NavLink>
            <NavLink to="/history" className={linkClass}>📋 History</NavLink>
          </nav>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-700">Logout</button>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
