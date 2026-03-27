'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gausul Azam Jameh Mosjid — Management Dashboard
// Road 9, Sector 13, Uttara, Dhaka
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── API helpers ──
async function apiCall(url, options = {}) {
  try {
    const res = await fetch(url, { credentials: 'include', ...options })
    const text = await res.text()
    let data
    try {
      data = JSON.parse(text)
    } catch {
      console.error('Non-JSON response:', res.status, text.slice(0, 200))
      return { error: `Server error (${res.status}) — try refreshing the page` }
    }
    if (!res.ok && !data.error) {
      return { error: `Request failed (${res.status})` }
    }
    return data
  } catch (e) {
    console.error('API error:', e)
    return { error: 'Network error — check your connection and try again' }
  }
}

const api = {
  get: (url) => apiCall(url),
  post: (url, data) => apiCall(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  put: (url, data) => apiCall(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
  del: (url) => apiCall(url, { method: 'DELETE' }),
}

// ── Toast Notification ──
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border text-sm font-medium shadow-lg transition-all ${
      type === 'success' ? 'bg-masjid-green/15 border-masjid-green/30 text-masjid-green' :
      type === 'pending' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
      'bg-red-500/15 border-red-500/30 text-red-400'
    }`}>
      {message}
    </div>
  )
}

// ── Icons (inline SVGs) ──
function Icon({ name, size = 20, className = '' }) {
  const paths = {
    layout: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
    edit: <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    save: <><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    menu: <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    mosque: <><path d="M12 2C8 6 4 8 4 12v8h16v-8c0-4-4-6-8-10z"/><rect x="9" y="16" width="6" height="4"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    shield: <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
    logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  )
}

// ── Dashboard Overview ──
function Overview({ prayers, imams, loading, pendingCount, userRole }) {
  const stats = [
    { label: 'Prayer Times', value: prayers.length, icon: 'clock', color: 'green' },
    { label: 'Imam Profiles', value: imams.length, icon: 'user', color: 'gold' },
    { label: 'Today', value: new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }), icon: 'star', color: 'green' },
    { label: userRole === 'ADMIN' ? 'Pending Approvals' : 'App Status', value: userRole === 'ADMIN' ? pendingCount : 'Live', icon: userRole === 'ADMIN' ? 'shield' : 'bell', color: 'gold' },
  ]

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-5">Dashboard Overview</h2>
      {loading ? (
        <div className="text-gray-500">Loading data...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s, i) => (
              <div key={i} className="bg-masjid-card rounded-xl p-5 border border-masjid-border flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color === 'green' ? 'bg-masjid-green/10' : 'bg-masjid-gold/10'}`}>
                  <Icon name={s.icon} className={s.color === 'green' ? 'text-masjid-green' : 'text-masjid-gold'} />
                </div>
                <div>
                  <div className="text-gray-500 text-xs">{s.label}</div>
                  <div className="text-white text-xl font-bold">{s.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-masjid-card rounded-xl p-5 border border-masjid-border">
            <h3 className="text-masjid-gold font-medium mb-4">Today&apos;s Prayer Times</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {prayers.map((p) => (
                <div key={p.id} className={`p-3 rounded-lg border ${p.isNext ? 'bg-masjid-green text-masjid-dark border-masjid-green' : 'bg-masjid-bg border-masjid-border'}`}>
                  <div className={`text-xs mb-2 text-center ${p.isNext ? 'text-masjid-dark/70' : 'text-gray-500'}`}>{p.name}</div>
                  <div className="flex justify-around">
                    {p.adhan && (
                      <div className="text-center">
                        <div className={`text-[0.6rem] uppercase tracking-wider ${p.isNext ? 'text-masjid-dark/50' : 'text-gray-600'}`}>Adhan</div>
                        <div className={`text-sm font-semibold ${p.isNext ? 'text-masjid-dark/80' : 'text-gray-400'}`}>{p.adhan}</div>
                      </div>
                    )}
                    <div className="text-center">
                      <div className={`text-[0.6rem] uppercase tracking-wider ${p.isNext ? 'text-masjid-dark/50' : 'text-gray-600'}`}>{p.adhan ? 'Jamaat' : 'Time'}</div>
                      <div className={`text-sm font-bold ${p.isNext ? 'text-masjid-dark' : 'text-white'}`}>{p.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Prayer Times Manager ──
// Time picker: structured hour:minute AM/PM selects instead of free text
function TimePicker({ value, onChange, label }) {
  // Parse "4:30 PM" → { hour: '4', minute: '30', period: 'PM' }
  const parsed = useMemo(() => {
    const m = (value || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i)
    if (m) return { hour: m[1], minute: m[2].padStart(2, '0'), period: m[3].toUpperCase() }
    return { hour: '12', minute: '00', period: 'PM' }
  }, [value])

  const update = (field, val) => {
    const next = { ...parsed, [field]: val }
    onChange(`${next.hour}:${next.minute} ${next.period}`)
  }

  const inputCls = "bg-masjid-bg border border-masjid-border rounded-lg px-2 py-2 text-white text-sm text-center focus:border-masjid-green outline-none"

  return (
    <div className="flex items-center gap-1 mr-2">
      <select className={inputCls + " w-16"} value={parsed.hour} onChange={e => update('hour', e.target.value)}>
        {Array.from({ length: 12 }, (_, i) => i + 1).map(h => <option key={h} value={String(h)}>{String(h)}</option>)}
      </select>
      <span className="text-gray-400 font-bold">:</span>
      <select className={inputCls + " w-16"} value={parsed.minute} onChange={e => update('minute', e.target.value)}>
        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <select className={inputCls + " w-16"} value={parsed.period} onChange={e => update('period', e.target.value)}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  )
}

function PrayerManager({ prayers, onRefresh, onToast }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', adhan: '', time: '' })
  const [saving, setSaving] = useState(false)
  const [calculated, setCalculated] = useState(null)

  // Load calculated adhan times for Uttara, Dhaka
  useEffect(() => {
    api.get('/api/prayers?calculated=1').then(data => {
      if (data.calculated) setCalculated(data.calculated)
    })
  }, [])

  const startEdit = (p) => { setEditing(p.id); setForm({ name: p.name, adhan: p.adhan || '', time: p.time }) }
  const cancel = () => { setEditing(null); setForm({ name: '', adhan: '', time: '' }) }

  const useCalculated = (prayerName) => {
    if (!calculated) return
    const adhanTime = calculated[prayerName]
    if (adhanTime) setForm(f => ({ ...f, adhan: adhanTime }))
  }

  const save = async (id) => {
    setSaving(true)
    const result = await api.put('/api/prayers', { id, ...form, adhan: form.adhan || null })
    if (result.error) {
      onToast(result.error, 'error')
      setSaving(false)
      return
    }
    if (result.pending) {
      onToast(result.message, 'pending')
    } else {
      onToast('Prayer time updated', 'success')
    }
    await onRefresh()
    cancel()
    setSaving(false)
  }

  const setNext = async (id) => {
    const result = await api.put('/api/prayers', { id, isNext: true })
    if (result.pending) {
      onToast(result.message, 'pending')
    }
    await onRefresh()
  }

  const [syncing, setSyncing] = useState(false)
  const syncCalculated = async () => {
    setSyncing(true)
    const result = await api.post('/api/prayers')
    if (result.error) {
      onToast(result.error, 'error')
    } else {
      onToast('Prayer times synced with calculated times', 'success')
      await onRefresh()
    }
    setSyncing(false)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-white text-xl font-semibold">Prayer Times</h2>
          {calculated && <p className="text-xs text-gray-500 mt-1">Calculated for Uttara, Dhaka (Karachi method, Hanafi)</p>}
        </div>
        <button onClick={syncCalculated} disabled={syncing} className="bg-masjid-gold/20 border border-masjid-gold/40 text-masjid-gold px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 hover:bg-masjid-gold/30 transition disabled:opacity-50">
          <Icon name="refresh-cw" size={14} /> {syncing ? 'Syncing...' : 'Sync Calculated Times'}
        </button>
      </div>
      <div className="bg-masjid-card rounded-xl overflow-hidden border border-masjid-border">
        <div className="grid grid-cols-[1fr_1fr_1fr_80px_140px] px-5 py-3 bg-masjid-bg border-b border-masjid-border text-xs text-gray-500 font-semibold uppercase tracking-wider">
          <span>Prayer</span><span>Adhan</span><span>Jamaat</span><span>Status</span><span className="text-right">Actions</span>
        </div>
        {prayers.map((prayer, i) => (
          <div key={prayer.id} className={`grid grid-cols-[1fr_1fr_1fr_80px_140px] px-5 py-4 items-center ${i < prayers.length - 1 ? 'border-b border-masjid-border' : ''}`}>
            {editing === prayer.id ? (
              <>
                <input className="bg-masjid-bg border border-masjid-border rounded-lg px-3 py-2 text-white text-sm mr-2 focus:border-masjid-green outline-none" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Prayer name" />
                <div className="flex flex-col gap-1">
                  <TimePicker value={form.adhan} onChange={v => setForm({ ...form, adhan: v })} />
                  {calculated && calculated[prayer.name] && (
                    <button onClick={() => useCalculated(prayer.name)} className="text-[0.6rem] text-masjid-gold hover:text-masjid-green transition" type="button">
                      Use calculated: {calculated[prayer.name]}
                    </button>
                  )}
                </div>
                <TimePicker value={form.time} onChange={v => setForm({ ...form, time: v })} />
                <span />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => save(prayer.id)} disabled={saving} className="bg-masjid-green text-masjid-dark px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50">
                    <Icon name="save" size={14} /> {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={cancel} className="bg-masjid-border text-gray-400 px-3 py-1.5 rounded-lg text-xs"><Icon name="x" size={14} /></button>
                </div>
              </>
            ) : (
              <>
                <span className="text-white font-medium">{prayer.name}</span>
                <div>
                  <span className="text-gray-400">{prayer.adhan || '—'}</span>
                  {calculated && calculated[prayer.name] && (
                    <div className="text-[0.6rem] text-masjid-gold/60">calc: {calculated[prayer.name]}</div>
                  )}
                </div>
                <span className="text-gray-400">{prayer.time}</span>
                <span>
                  {prayer.isNext
                    ? <span className="px-2.5 py-1 rounded-full bg-masjid-green/15 text-masjid-green text-[0.65rem] font-semibold">NEXT</span>
                    : <span className="text-gray-600 text-sm">&mdash;</span>}
                </span>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => startEdit(prayer)} className="bg-masjid-green/10 border border-masjid-green/30 text-masjid-green rounded-lg px-2.5 py-1.5 text-xs flex items-center gap-1 hover:bg-masjid-green/20 transition"><Icon name="edit" size={14} /></button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Jummah Manager ──
function JummahManager({ jummah, onRefresh, onToast }) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', time: '', khateeb: '' })

  useEffect(() => { if (jummah) setForm({ name: jummah.name || '', time: jummah.time || '', khateeb: jummah.khateeb || '' }) }, [jummah])

  const save = async () => {
    setSaving(true)
    const result = await api.put('/api/jummah', { name: form.name, time: form.time, khateeb: form.khateeb })
    if (result.error) {
      onToast(result.error, 'error')
      setSaving(false)
      return
    }
    if (result.pending) {
      onToast(result.message, 'pending')
    } else {
      onToast('Jummah settings updated', 'success')
    }
    await onRefresh()
    setEditing(false)
    setSaving(false)
  }

  if (!jummah) return <div className="text-gray-500">Loading...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-white text-xl font-semibold">Jummah Prayer</h2>
        {!editing && <button onClick={() => setEditing(true)} className="bg-masjid-green text-masjid-dark px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Icon name="edit" size={16} /> Edit</button>}
      </div>
      <div className="bg-masjid-card rounded-xl p-6 border border-masjid-border">
        {editing ? (
          <div className="flex flex-col gap-4">
            {[['Prayer Name', 'name'], ['Khateeb', 'khateeb']].map(([label, key]) => (
              <div key={key}>
                <label className="block text-masjid-gold text-xs mb-1.5 font-medium">{label}</label>
                <input className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <div>
              <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Prayer Time</label>
              <TimePicker value={form.time} onChange={v => setForm({ ...form, time: v })} />
            </div>
            <div className="flex gap-3 mt-2">
              <button onClick={save} disabled={saving} className="bg-masjid-green text-masjid-dark px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"><Icon name="save" size={16} /> {saving ? 'Saving...' : 'Save'}</button>
              <button onClick={() => { setForm({ name: jummah?.name || '', time: jummah?.time || '', khateeb: jummah?.khateeb || '' }); setEditing(false) }} className="border border-masjid-border text-gray-400 px-5 py-2.5 rounded-lg text-sm bg-transparent">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'Prayer Name', value: jummah.name, icon: 'star', color: 'text-masjid-gold' },
              { label: 'Time', value: jummah.time, icon: 'clock', color: 'text-masjid-green' },
              { label: 'Khateeb', value: jummah.khateeb, icon: 'user', color: 'text-masjid-gold' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-masjid-bg flex items-center justify-center"><Icon name={item.icon} className={item.color} /></div>
                <div>
                  <div className="text-gray-500 text-[0.65rem] uppercase tracking-wider">{item.label}</div>
                  <div className="text-white font-medium mt-0.5">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Imams Manager ──
function ImamsManager({ imams, onRefresh, onToast }) {
  const [editing, setEditing] = useState(null)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const empty = { name: '', role: '', bio: '', contact: '' }
  const [form, setForm] = useState(empty)

  const cancel = () => { setEditing(null); setAdding(false); setForm(empty) }

  const save = async () => {
    setSaving(true)
    let result
    if (adding) {
      result = await api.post('/api/imams', form)
    } else {
      result = await api.put('/api/imams', { id: editing, ...form })
    }
    if (result.error) {
      onToast(result.error, 'error')
      setSaving(false)
      return
    }
    if (result.pending) {
      onToast(result.message, 'pending')
    } else {
      onToast(adding ? 'Imam added successfully' : 'Imam updated successfully', 'success')
    }
    await onRefresh()
    cancel()
    setSaving(false)
  }

  const remove = async (id) => {
    const result = await api.del(`/api/imams?id=${id}`)
    if (result.pending) {
      onToast(result.message, 'pending')
    } else {
      onToast('Imam removed', 'success')
    }
    await onRefresh()
  }

  const inputClass = "w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green"

  const formFields = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Full Name</label>
        <input className={inputClass} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div>
        <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Role / Title</label>
        <input className={inputClass} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Biography</label>
        <textarea className={`${inputClass} min-h-[80px] resize-y`} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Contact Email</label>
        <input className={inputClass} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
      </div>
      <div className="sm:col-span-2 flex gap-3 mt-1">
        <button onClick={save} disabled={saving} className="bg-masjid-green text-masjid-dark px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"><Icon name="save" size={16} /> {saving ? 'Saving...' : adding ? 'Add Imam' : 'Save'}</button>
        <button onClick={cancel} className="border border-masjid-border text-gray-400 px-5 py-2.5 rounded-lg text-sm bg-transparent">Cancel</button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-white text-xl font-semibold">Imam Profiles</h2>
        <button onClick={() => { setAdding(true); setEditing(null); setForm(empty) }} className="bg-masjid-green text-masjid-dark px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"><Icon name="plus" size={16} /> Add Imam</button>
      </div>
      {adding && (
        <div className="bg-masjid-card rounded-xl p-6 border border-masjid-green/30 mb-4">
          <h3 className="text-masjid-green font-medium mb-4">New Imam Profile</h3>
          {formFields}
        </div>
      )}
      <div className="flex flex-col gap-4">
        {imams.map((imam) => (
          <div key={imam.id} className={`bg-masjid-card rounded-xl p-5 border ${editing === imam.id ? 'border-masjid-green/40' : 'border-masjid-border'}`}>
            {editing === imam.id ? (
              <><h3 className="text-masjid-gold font-medium mb-4">Editing: {imam.name}</h3>{formFields}</>
            ) : (
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-masjid-green rounded-full flex items-center justify-center flex-shrink-0"><Icon name="user" size={28} className="text-masjid-dark" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-masjid-gold font-semibold text-lg">{imam.name}</h3>
                  <p className="text-masjid-green text-sm mt-0.5">{imam.role}</p>
                  <p className="text-gray-400 text-sm mt-2 leading-relaxed">{imam.bio}</p>
                  <p className="text-gray-500 text-xs mt-2">{imam.contact}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditing(imam.id); setAdding(false); setForm({ name: imam.name, role: imam.role, bio: imam.bio, contact: imam.contact || '' }) }} className="bg-masjid-green/10 border border-masjid-green/30 rounded-lg p-2 hover:bg-masjid-green/20 transition"><Icon name="edit" size={16} className="text-masjid-green" /></button>
                  <button onClick={() => remove(imam.id)} className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 hover:bg-red-500/20 transition"><Icon name="trash" size={16} className="text-red-400" /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Notifications ──
function Notifications({ onToast }) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState([])
  const [sending, setSending] = useState(false)

  useEffect(() => { api.get('/api/notifications').then(setSent) }, [])

  const send = async () => {
    if (!title.trim() || !message.trim()) return
    setSending(true)
    const result = await api.post('/api/notifications', { title, message })
    if (result.pending) {
      onToast(result.message, 'pending')
    } else {
      setSent([result, ...sent])
    }
    setTitle(''); setMessage(''); setSending(false)
  }

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-5">Push Notifications</h2>
      <div className="bg-masjid-card rounded-xl p-6 border border-masjid-border mb-6">
        <h3 className="text-masjid-gold font-medium mb-4">Send Notification</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Title</label>
            <input className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Prayer Time Change" />
          </div>
          <div>
            <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Message</label>
            <textarea className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green min-h-[100px] resize-y" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type your message..." />
          </div>
          <button onClick={send} disabled={sending} className={`self-start bg-masjid-green text-masjid-dark px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 ${sending ? 'opacity-50' : ''}`}>
            <Icon name="send" size={16} /> {sending ? 'Sending...' : 'Send to All Users'}
          </button>
        </div>
      </div>
      {sent.length > 0 && (
        <div>
          <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">Recently Sent</h3>
          <div className="flex flex-col gap-3">
            {sent.map((n) => (
              <div key={n.id} className="bg-masjid-card rounded-xl p-4 border border-masjid-border">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-white font-medium text-sm">{n.title}</span>
                  <span className="text-gray-600 text-xs">{new Date(n.sentAt).toLocaleString()}</span>
                </div>
                <p className="text-gray-400 text-sm">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Pending Approvals (Admin) / My Submissions (Moderator) ──
function PendingApprovals({ userRole, onToast }) {
  const [changes, setChanges] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(null)
  const [denyReason, setDenyReason] = useState('')
  const [denyingId, setDenyingId] = useState(null)

  const load = useCallback(async () => {
    const data = await api.get('/api/pending')
    setChanges(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAction = async (id, status, reason) => {
    setProcessing(id)
    await api.put('/api/pending', { id, status, reason })
    onToast(status === 'APPROVED' ? 'Change approved and applied' : 'Change denied', status === 'APPROVED' ? 'success' : 'error')
    setDenyingId(null)
    setDenyReason('')
    await load()
    setProcessing(null)
  }

  const statusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      APPROVED: 'bg-masjid-green/15 text-masjid-green border-masjid-green/30',
      DENIED: 'bg-red-500/15 text-red-400 border-red-500/30',
    }
    return <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-semibold border ${styles[status]}`}>{status}</span>
  }

  const actionLabel = (action) => {
    const labels = { CREATE: 'New', UPDATE: 'Edit', DELETE: 'Delete' }
    return labels[action] || action
  }

  const resourceLabel = (type) => {
    const labels = { PRAYER: 'Prayer Time', IMAM: 'Imam Profile', JUMMAH: 'Jummah Setting', NOTIFICATION: 'Notification' }
    return labels[type] || type
  }

  const renderDataPreview = (change) => {
    const data = change.data
    if (!data) return null

    const entries = Object.entries(data).filter(([key]) => !['id'].includes(key))
    if (entries.length === 0) return null

    return (
      <div className="mt-3 bg-masjid-bg rounded-lg p-3 border border-masjid-border">
        <div className="text-gray-500 text-[0.6rem] uppercase tracking-wider mb-2">Proposed Changes</div>
        {entries.map(([key, value]) => (
          value != null && (
            <div key={key} className="flex gap-2 text-sm mb-1">
              <span className="text-gray-500 capitalize">{key}:</span>
              <span className="text-white">{String(value)}</span>
            </div>
          )
        ))}
      </div>
    )
  }

  const pending = changes.filter(c => c.status === 'PENDING')
  const reviewed = changes.filter(c => c.status !== 'PENDING')

  return (
    <div>
      <h2 className="text-white text-xl font-semibold mb-5">
        {userRole === 'ADMIN' ? 'Pending Approvals' : 'My Submissions'}
      </h2>

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : changes.length === 0 ? (
        <div className="bg-masjid-card rounded-xl p-8 border border-masjid-border text-center">
          <Icon name="check" size={40} className="text-masjid-green mx-auto mb-3" />
          <p className="text-gray-400">No pending changes</p>
        </div>
      ) : (
        <>
          {/* Pending */}
          {pending.length > 0 && (
            <div className="mb-6">
              <h3 className="text-yellow-400 text-xs uppercase tracking-wider font-semibold mb-3">
                Pending ({pending.length})
              </h3>
              <div className="flex flex-col gap-3">
                {pending.map((change) => (
                  <div key={change.id} className="bg-masjid-card rounded-xl p-5 border border-yellow-500/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {statusBadge(change.status)}
                          <span className="text-white font-medium text-sm">
                            {actionLabel(change.action)} {resourceLabel(change.resourceType)}
                          </span>
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                          By {change.submitter?.name || 'Unknown'} &middot; {new Date(change.createdAt).toLocaleString()}
                        </div>
                        {renderDataPreview(change)}
                      </div>

                      {userRole === 'ADMIN' && (
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleAction(change.id, 'APPROVED')}
                            disabled={processing === change.id}
                            className="bg-masjid-green text-masjid-dark px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
                          >
                            <Icon name="check" size={14} /> Approve
                          </button>
                          {denyingId === change.id ? (
                            <div className="flex flex-col gap-2">
                              <input
                                value={denyReason}
                                onChange={e => setDenyReason(e.target.value)}
                                placeholder="Reason (optional)"
                                className="bg-masjid-bg border border-masjid-border rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-red-400 w-40"
                              />
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleAction(change.id, 'DENIED', denyReason)}
                                  disabled={processing === change.id}
                                  className="bg-red-500/20 border border-red-500/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex-1 disabled:opacity-50"
                                >
                                  Confirm
                                </button>
                                <button onClick={() => { setDenyingId(null); setDenyReason('') }} className="bg-masjid-border text-gray-400 px-2 py-1.5 rounded-lg text-xs">
                                  <Icon name="x" size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDenyingId(change.id)}
                              className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                            >
                              <Icon name="x" size={14} /> Deny
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <div>
              <h3 className="text-gray-500 text-xs uppercase tracking-wider font-semibold mb-3">
                Reviewed ({reviewed.length})
              </h3>
              <div className="flex flex-col gap-3">
                {reviewed.map((change) => (
                  <div key={change.id} className={`bg-masjid-card rounded-xl p-5 border ${change.status === 'APPROVED' ? 'border-masjid-green/15' : 'border-red-500/15'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {statusBadge(change.status)}
                      <span className="text-white font-medium text-sm">
                        {actionLabel(change.action)} {resourceLabel(change.resourceType)}
                      </span>
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      By {change.submitter?.name || 'Unknown'} &middot; {new Date(change.createdAt).toLocaleString()}
                      {change.reviewer && <> &middot; Reviewed by {change.reviewer.name}</>}
                    </div>
                    {change.reason && (
                      <div className="mt-2 text-red-400 text-xs">Reason: {change.reason}</div>
                    )}
                    {renderDataPreview(change)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ── User Management (Admin only) ──
function UserManagement({ currentUser, onToast }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MODERATOR' })

  const load = useCallback(async () => {
    const data = await api.get('/api/users')
    setUsers(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const addUser = async () => {
    if (!form.name || !form.email || !form.password) {
      onToast('All fields are required', 'error')
      return
    }
    if (form.password.length < 8) {
      onToast('Password must be at least 8 characters', 'error')
      return
    }
    if (!/[A-Z]/.test(form.password)) {
      onToast('Password must contain at least one uppercase letter', 'error')
      return
    }
    if (!/[0-9]/.test(form.password)) {
      onToast('Password must contain at least one number', 'error')
      return
    }
    const result = await api.post('/api/users', form)
    if (result.error) {
      onToast(result.error, 'error')
      return
    }
    onToast('User created successfully', 'success')
    setAdding(false)
    setForm({ name: '', email: '', password: '', role: 'MODERATOR' })
    await load()
  }

  const removeUser = async (id) => {
    const result = await api.del(`/api/users?id=${id}`)
    if (result.error) {
      onToast(result.error, 'error')
      return
    }
    onToast('User removed', 'success')
    await load()
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-white text-xl font-semibold">User Management</h2>
        <button onClick={() => setAdding(!adding)} className="bg-masjid-green text-masjid-dark px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
          <Icon name="plus" size={16} /> Add User
        </button>
      </div>

      {adding && (
        <div className="bg-masjid-card rounded-xl p-6 border border-masjid-green/30 mb-4">
          <h3 className="text-masjid-green font-medium mb-4">New User</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Full Name</label>
              <input className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Email</label>
              <input type="email" className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Password</label>
              <input type="password" className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="block text-masjid-gold text-xs mb-1.5 font-medium">Role</label>
              <select className="w-full bg-masjid-bg border border-masjid-border rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-masjid-green" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="MODERATOR">Moderator</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-3 mt-1">
              <button onClick={addUser} className="bg-masjid-green text-masjid-dark px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"><Icon name="save" size={16} /> Create User</button>
              <button onClick={() => setAdding(false)} className="border border-masjid-border text-gray-400 px-5 py-2.5 rounded-lg text-sm bg-transparent">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="flex flex-col gap-3">
          {users.map((user) => (
            <div key={user.id} className="bg-masjid-card rounded-xl p-5 border border-masjid-border flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${user.role === 'ADMIN' ? 'bg-masjid-gold/20' : 'bg-masjid-green/20'}`}>
                <Icon name={user.role === 'ADMIN' ? 'shield' : 'user'} size={22} className={user.role === 'ADMIN' ? 'text-masjid-gold' : 'text-masjid-green'} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-medium">{user.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[0.6rem] font-semibold ${user.role === 'ADMIN' ? 'bg-masjid-gold/15 text-masjid-gold' : 'bg-masjid-green/15 text-masjid-green'}`}>
                    {user.role}
                  </span>
                  {user.id === currentUser.id && (
                    <span className="px-2 py-0.5 rounded-full text-[0.6rem] font-semibold bg-blue-500/15 text-blue-400">YOU</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
              {user.id !== currentUser.id && (
                <button onClick={() => removeUser(user.id)} className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 hover:bg-red-500/20 transition flex-shrink-0">
                  <Icon name="trash" size={16} className="text-red-400" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Dashboard
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [section, setSection] = useState('overview')
  const [sidebar, setSidebar] = useState(true)
  const [loading, setLoading] = useState(true)
  const [prayers, setPrayers] = useState([])
  const [jummah, setJummah] = useState(null)
  const [imams, setImams] = useState([])
  const [pendingCount, setPendingCount] = useState(0)
  const [toast, setToast] = useState(null)

  const showToast = useCallback((message, type) => {
    setToast({ message, type })
  }, [])

  // Check auth on mount + warm up DB connection
  useEffect(() => {
    // Warm up the DB immediately to avoid cold start on first action
    fetch('/api/keepalive')

    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
      .finally(() => setAuthLoading(false))
  }, [router])

  // Keep DB warm while dashboard is open (ping every 4 min)
  useEffect(() => {
    const interval = setInterval(() => {
      fetch('/api/keepalive')
    }, 4 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const loadData = useCallback(async () => {
    try {
      // Load mosque data and pending count in parallel
      const [mosqueData, pending] = await Promise.all([
        api.get('/api/mosque'),
        api.get('/api/pending'),
      ])
      setPrayers(mosqueData.prayers || [])
      setJummah(mosqueData.jummah)
      setImams(mosqueData.imams || [])

      if (Array.isArray(pending)) {
        setPendingCount(pending.filter(p => p.status === 'PENDING').length)
      }
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) loadData()
  }, [user, loadData])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    router.push('/login')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c0a] flex items-center justify-center" style={{ fontFamily: "'Inter', sans-serif" }}>
        <div className="text-center">
          <div className="w-12 h-12 bg-masjid-green rounded-xl flex items-center justify-center mx-auto mb-3">
            <Icon name="mosque" size={24} className="text-masjid-dark" />
          </div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const menu = [
    { id: 'overview', label: 'Dashboard', icon: 'layout' },
    { id: 'prayers', label: 'Prayer Times', icon: 'clock' },
    { id: 'jummah', label: 'Jummah Prayer', icon: 'star' },
    { id: 'imams', label: 'Imam Profiles', icon: 'user' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'approvals', label: user.role === 'ADMIN' ? 'Approvals' : 'My Submissions', icon: 'shield', badge: pendingCount > 0 ? pendingCount : null },
    ...(user.role === 'ADMIN' ? [{ id: 'users', label: 'Users', icon: 'users' }] : []),
  ]

  return (
    <div className="flex min-h-screen bg-[#0a0c0a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <aside className="bg-masjid-bg border-r border-masjid-border flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden" style={{ width: sidebar ? 260 : 0 }}>
        <div className="p-5 border-b border-masjid-border whitespace-nowrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-masjid-green rounded-lg flex items-center justify-center flex-shrink-0"><Icon name="mosque" size={22} className="text-masjid-dark" /></div>
            <div>
              <h1 className="text-masjid-gold font-bold text-sm">Gausul Azam Mosjid</h1>
              <p className="text-gray-600 text-[0.6rem]">Uttara, Dhaka</p>
            </div>
          </div>
        </div>
        <nav className="p-3 flex-1">
          {menu.map(({ id, label, icon, badge }) => (
            <button key={id} onClick={() => setSection(id)} className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-lg text-sm mb-1 transition-all text-left whitespace-nowrap border-none cursor-pointer ${section === id ? 'bg-masjid-green/10 text-masjid-green font-semibold' : 'bg-transparent text-gray-400 hover:bg-masjid-card'}`}>
              <Icon name={icon} className={section === id ? 'text-masjid-green' : 'text-gray-500'} />
              {label}
              {badge && (
                <span className="ml-auto bg-yellow-500/20 text-yellow-400 text-[0.6rem] font-bold px-2 py-0.5 rounded-full">{badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-4 border-t border-masjid-border whitespace-nowrap">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${user.role === 'ADMIN' ? 'bg-masjid-gold/20' : 'bg-masjid-green/20'}`}>
              <Icon name={user.role === 'ADMIN' ? 'shield' : 'user'} size={14} className={user.role === 'ADMIN' ? 'text-masjid-gold' : 'text-masjid-green'} />
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.name}</p>
              <p className={`text-[0.6rem] font-semibold ${user.role === 'ADMIN' ? 'text-masjid-gold' : 'text-masjid-green'}`}>{user.role}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-red-400 text-xs transition bg-transparent border-none cursor-pointer w-full px-1">
            <Icon name="logout" size={14} /> Sign Out
          </button>
          <p className="text-gray-700 text-[0.6rem] mt-3">&copy; 2026 Gausul Azam Jameh Mosjid &middot; v2.2</p>
          <p className="text-masjid-gold text-[0.55rem] mt-1 font-semibold">Powered by Trinovent Tech</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-[60px] bg-masjid-bg border-b border-masjid-border flex items-center px-6 gap-4 flex-shrink-0">
          <button onClick={() => setSidebar(!sidebar)} className="bg-transparent border-none cursor-pointer text-gray-400 hover:text-white transition p-1"><Icon name="menu" /></button>
          <h2 className="text-white font-medium text-sm">{menu.find(m => m.id === section)?.label}</h2>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">
          {section === 'overview' && <Overview prayers={prayers} imams={imams} loading={loading} pendingCount={pendingCount} userRole={user.role} />}
          {section === 'prayers' && <PrayerManager prayers={prayers} onRefresh={loadData} onToast={showToast} />}
          {section === 'jummah' && <JummahManager jummah={jummah} onRefresh={loadData} onToast={showToast} />}
          {section === 'imams' && <ImamsManager imams={imams} onRefresh={loadData} onToast={showToast} />}
          {section === 'notifications' && <Notifications onToast={showToast} />}
          {section === 'approvals' && <PendingApprovals userRole={user.role} onToast={showToast} />}
          {section === 'users' && user.role === 'ADMIN' && <UserManagement currentUser={user} onToast={showToast} />}
        </main>
      </div>
    </div>
  )
}
