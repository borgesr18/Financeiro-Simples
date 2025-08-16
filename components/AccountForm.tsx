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

  // Novos campos
  const [initialBalance, setInitialBalance] = useState<string>('') // mantém string para permitir vazio/negativo/decimal
  const [initialDate,   setInitialDate]   = useState<string>(new Date().toISOString().slice(0,10))

  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Sessão expirada. Faça login.'); return }

      // 1) Cria a conta e pega o id
      const { data: acc, error: e1 } = await supabase
        .from('accounts')
        .insert({
          user_id: user.id,
          name,
          type,
          institution: institution || null,
          currency: currency || 'BRL',
        })
        .select('id')
        .single()

      if (e1) { setError(e1.message); return }
      const accountId = acc!.id as string

      // 2) Se houver saldo inicial, cria uma transação "Saldo inicial"
      const hasInitial = initialBalance !== '' && !Number.isNaN(Number(initialBalance)) && Number(initialBalance) !== 0
      if (hasInitial) {
        const amount = Number(initialBalance) // positivo = entrada, negativo = saída
        const when = initialDate || new Date().toISOString().slice(0,10)

        const { error: e2 } = await supabase.from('transactions').insert({
          user_id: user.id,
          account_id: accountId,
          date: when,
          description: 'Saldo inicial',
          amount,
          category_id: null,
        })
        if (e2) { setError(`Conta criada, mas falhou ao registrar saldo inicial: ${e2.message}`); }
      }

      router.push('/banking')
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Nome</label>
        <input
          value={name}
          onChange={e=>setName(e.target.value)}
          required
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Tipo</label>
        <select
          value={type}
          onChange={e=>setType(e.target.value)}
          className="w-full rounded border px-3 py-2"
        >
          {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Instituição (opcional)</label>
        <input
          value={institution}
          onChange={e=>setInstitution(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Moeda</label>
        <input
          value={currency}
          onChange={e=>setCurrency(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>

      {/* NOVIDADE: Saldo inicial */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Saldo inicial (R$)</label>
          <input
            type="number"
            step="0.01"
            value={initialBalance}
            onChange={e=>setInitialBalance(e.target.value)}
            className="w-full rounded border px-3 py-2"
            placeholder="0,00"
          />
          <p className="text-xs text-neutral-500 mt-1">
            Use número positivo (crédito) ou negativo (débito). Será criada uma transação “Saldo inicial”.
          </p>
        </div>
        <div>
          <label className="block text-sm mb-1">Data do saldo</label>
          <input
            type="date"
            value={initialDate}
            onChange={e=>setInitialDate(e.target.value)}
            className="w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        className="px-4 py-2 bg-sky-500 text-white rounded-lg"
        disabled={saving}
      >
        {saving ? 'Salvando...' : 'Salvar conta'}
      </button>
    </form>
  )
}

