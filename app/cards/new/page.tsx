// app/cards/new/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createCard } from '../actions'

export default async function NewCardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para criar cartões.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Novo cartão</h1>
        <Link href="/cards" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Voltar</Link>
      </div>

      <form action={createCard} className="bg-white rounded-xl shadow-card p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input name="name" className="w-full rounded-lg border px-3 py-2" placeholder="Meu Cartão" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Marca</label>
            <input name="brand" className="w-full rounded-lg border px-3 py-2" placeholder="Visa / Master / Elo..." />
          </div>
          <div>
            <label className="block text-sm mb-1">Final</label>
            <input name="last4" className="w-full rounded-lg border px-3 py-2" placeholder="1234" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Instituição</label>
            <input name="institution" className="w-full rounded-lg border px-3 py-2" placeholder="Banco/Fintech" />
          </div>
          <div>
            <label className="block text-sm mb-1">Limite</label>
            <input name="limit_amount" type="number" step="0.01" className="w-full rounded-lg border px-3 py-2" placeholder="0,00" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Fechamento (1–28)</label>
            <input name="closing_day" type="number" min={1} max={28} className="w-full rounded-lg border px-3 py-2" defaultValue={5} />
          </div>
          <div>
            <label className="block text-sm mb-1">Vencimento (1–28)</label>
            <input name="due_day" type="number" min={1} max={28} className="w-full rounded-lg border px-3 py-2" defaultValue={12} />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Cor</label>
            <input name="color_hex" className="w-full rounded-lg border px-3 py-2" placeholder="#3b82f6" />
          </div>
          <div>
            <label className="block text-sm mb-1">Ícone (slug)</label>
            <input name="icon_slug" className="w-full rounded-lg border px-3 py-2" placeholder="credit-card" />
          </div>
        </div>

        <div className="pt-2">
          <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg">
            Salvar
          </button>
        </div>
      </form>
    </main>
  )
}

