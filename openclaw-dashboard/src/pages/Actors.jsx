import React, { useEffect, useState } from 'react'
import { api } from '../api'

const CATEGORY_LABELS = {
  general: '🌐 General',
  content: '📄 Content',
  search: '🔍 Search',
  facebook: '📘 Facebook',
  social: '📱 Social Media',
  ecommerce: '🛒 E-Commerce',
  travel: '✈️ Travel',
  professional: '💼 Professional',
}

export default function Actors() {
  const [actors, setActors] = useState([])
  const [saving, setSaving] = useState(null)

  function load() {
    api.get('/admin/actors').then(d => setActors(d.actors))
  }
  useEffect(() => { load() }, [])

  async function toggle(actor) {
    setSaving(actor.id)
    await api.put(`/admin/actors/${actor.id}`, { is_active: !actor.is_active })
    setSaving(null)
    load()
  }

  const grouped = actors.reduce((acc, a) => {
    const cat = a.category || 'general'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Actors</h2>
        <p className="text-sm text-gray-500 mt-1">Manage which Apify actors are available to customers</p>
      </div>

      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat} className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h3 className="font-medium text-sm">{CATEGORY_LABELS[cat] || cat}</h3>
          </div>
          <div className="divide-y">
            {list.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-4">
                <span className="text-2xl w-8">{a.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{a.name}</p>
                  <p className="text-xs text-gray-500 truncate">{a.description}</p>
                  <p className="text-xs font-mono text-gray-400 mt-0.5">{a.actor_id}</p>
                </div>
                <button
                  onClick={() => toggle(a)}
                  disabled={saving === a.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    a.is_active ? 'bg-orange-500' : 'bg-gray-200'
                  } ${saving === a.id ? 'opacity-50' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    a.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
                <span className={`text-xs font-medium w-16 text-right ${a.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                  {a.is_active ? 'Active' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
