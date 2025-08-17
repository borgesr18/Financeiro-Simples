// app/reset-password/set/page.tsx
'use client'

import { FormEvent, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ResetSetPage() {
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [ok, setOk] = useState(false)
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
      // O usuário já deve estar numa sessão de "recovery" (token via link)
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setOk(true)
      setMsg('Senha atualizada com sucesso. Você já pode entrar.')
    } catch (err: any) {
      setMsg(err?.message ?? 'Falha ao atualizar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Definir nova senha</h1>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Nova senha</label>
            <input
              type="password"
              minLength={6}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <button
            disabled={loading}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60"
          >
            {loading ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
        {msg && (
          <p className={`text-sm ${ok ? 'text-emerald-700' : 'text-neutral-700'}`}>
            {msg}
          </p>
        )}
      </div>
    </main>
  )
}
