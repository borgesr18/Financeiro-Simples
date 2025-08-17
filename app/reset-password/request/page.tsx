// app/reset-password/request/page.tsx
'use client'

import { FormEvent, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ResetRequestPage() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const origin = window.location.origin
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/reset-password/set`,
      })
      if (error) throw error
      setMsg('Se existir uma conta com esse e-mail, enviaremos as instruções.')
    } catch (err: any) {
      setMsg(err?.message ?? 'Falha ao solicitar redefinição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Redefinir senha</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="email@exemplo.com"
            />
          </div>
          <button
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Enviando…' : 'Enviar link'}
          </button>
        </form>
        {msg && <p className="text-sm text-neutral-700">{msg}</p>}
      </div>
    </main>
  )
}
