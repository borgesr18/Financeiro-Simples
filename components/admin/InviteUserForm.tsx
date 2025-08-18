// components/admin/InviteUserForm.tsx
'use client'

import { useState } from 'react'

export default function InviteUserForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    setLoading(true)
    try {
      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error ?? 'Falha ao convidar')
      setMsg('Convite enviado com sucesso.')
      setEmail('')
    } catch (err: any) {
      setMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col sm:flex-row items-start sm:items-end gap-2">
      <div className="w-full sm:w-80">
        <label className="block text-sm mb-1">Convidar por e-mail</label>
        <input
          type="email"
          required
          placeholder="usuario@empresa.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-sky-600 text-white disabled:opacity-60"
      >
        {loading ? 'Enviando…' : 'Convidar'}
      </button>
      {msg && (
        <p className={`text-sm ${msg.includes('sucesso') ? 'text-emerald-600' : 'text-rose-600'}`}>
          {msg}
        </p>
      )}
    </form>
  )
}
