import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Crawl from './pages/Crawl'
import History from './pages/History'

function Guard({ children }) {
  return localStorage.getItem('customerKey') ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<Dashboard />} />
        <Route path="crawl" element={<Crawl />} />
        <Route path="history" element={<History />} />
      </Route>
    </Routes>
  )
}
