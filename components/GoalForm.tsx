// components/GoalForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function GoalForm() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [name, setName] = useState('')
  const [target, setTarget] = useState<number | ''>('')
  const [due, setDue] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Sessão expirada.'); return }

    const { error } = await supabase.from('goals').insert({
      user_id: user.id,
      name,
      target_amount: Number(target || 0),
      due_date: due || null,
    })
    if (error) { setError(error.message); return }

    router.push('/goals')
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Nome da meta</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="w-full rounded border px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Valor alvo (R$)</label>
        <input type="number" step="0.01" value={target} onChange={e=>setTarget(e.target.value === '' ? '' : Number(e.target.value))} className="w-full rounded border px-3 py-2" required />
      </div>
      <div>
        <label className="block text-sm mb-1">Prazo (opcional)</label>
        <input type="date" value={due} onChange={e=>setDue(e.target.value)} className="w-full rounded border px-3 py-2" />
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button className="px-4 py-2 bg-sky-500 text-white rounded-lg">Salvar meta</button>
    </form>
  )
}
