const BASE = import.meta.env.VITE_API_URL || '/api/v1'

function getKey() {
  return localStorage.getItem('customerKey') || ''
}

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data?.error?.message || 'Error'), { code: data?.error?.code, status: res.status })
  return data
}

export const api = {
  getPlan: () => req('GET', '/plan'),
  getUsage: (month) => req('GET', `/usage${month ? '?month=' + month : ''}`),
  crawl: (body) => req('POST', '/crawl', body),
  getActors: () => fetch(`${BASE}/actors`).then(r => r.json()),
}
