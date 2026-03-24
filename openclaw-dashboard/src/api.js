const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'

function getAdminKey() {
  return localStorage.getItem('adminKey') || ''
}

async function request(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getAdminKey()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error?.message || 'Request failed')
  return data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  delete: (path) => request('DELETE', path),
  getDashboard: () => request('GET', '/admin/dashboard'),
  getCustomers: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/admin/customers${q ? '?' + q : ''}`)
  },
  getCustomer: (id) => request('GET', `/admin/customers/${id}`),
  createCustomer: (body) => request('POST', '/admin/customers', body),
  updateCustomer: (id, body) => request('PUT', `/admin/customers/${id}`, body),
  deleteCustomer: (id) => request('DELETE', `/admin/customers/${id}`),
  resetCustomerKey: (id) => request('POST', `/admin/customers/${id}/reset-key`),
  getUsage: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/admin/usage${q ? '?' + q : ''}`)
  },
  getRevenue: () => request('GET', '/admin/revenue'),
  getPayments: (params = {}) => {
    const q = new URLSearchParams(params).toString()
    return request('GET', `/admin/payments${q ? '?' + q : ''}`)
  },
  createPayment: (body) => request('POST', '/admin/payments', body),
  updatePayment: (id, body) => request('PUT', `/admin/payments/${id}`, body),
  getPlans: () => request('GET', '/admin/plans'),
  createPlan: (body) => request('POST', '/admin/plans', body),
  updatePlan: (id, body) => request('PUT', `/admin/plans/${id}`, body),
}
