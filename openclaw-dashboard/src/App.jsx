import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import AddCustomer from './pages/AddCustomer'
import Payments from './pages/Payments'
import UsageAnalytics from './pages/UsageAnalytics'
import Revenue from './pages/Revenue'
import Plans from './pages/Plans'
import Actors from './pages/Actors'
import Pricing from './pages/Pricing'

function ProtectedRoute({ children }) {
  const key = localStorage.getItem('adminKey')
  if (!key) return <Navigate to="/login" />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Overview />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/add" element={<AddCustomer />} />
        <Route path="customers/:id" element={<CustomerDetail />} />
        <Route path="payments" element={<Payments />} />
        <Route path="usage" element={<UsageAnalytics />} />
        <Route path="revenue" element={<Revenue />} />
        <Route path="plans" element={<Plans />} />
        <Route path="actors" element={<Actors />} />
        <Route path="pricing" element={<Pricing />} />
      </Route>
    </Routes>
  )
}
