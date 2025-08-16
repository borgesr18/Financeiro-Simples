// components/AccountForm.tsx
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const TYPES = [
  { value: 'wallet', label: 'Carteira' },
  { value: 'checking', label: 'Conta corrente' },
  { value: 'savings', label: 'Poupança' },
  { value: 'credit', label: 'Cartão de crédito' },
  { value: 'investment', label: 'Investimento' },
  { value: 'other', label: 'Outra' },
]

export default function AccountForm() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [name, setName] = useState('')
  const [type, setType] = useState('wallet')
  const [institution, setInstitution] = useState('')
  const [currency, setCurrency] = useState('BRL')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada.'); return }

    const { error } = await supabase.from('accounts').insert({
      user_id: user.id,
      name, type,
      institution: institution || null,
      currency,
    })
    if (error) { setError(error.message); return }

    router.push('/banking')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Nome</label>
        <input value={name} onChange={e=>setName(e.target.value)} required className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Tipo</label>
        <select value={type} onChange={e=>setType(e.target.value)} className="w-full rounded border px-3 py-2">
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm mb-1">Instituição (opcional)</label>
        <input value={institution} onChange={e=>setInstitution(e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Moeda</label>
        <input value={currency} onChange={e=>setCurrency(e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button className="px-4 py-2 bg-sky-500 text-white rounded-lg">Salvar conta</button>
    </form>
  )
}
