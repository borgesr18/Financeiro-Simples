// app/cards/new/page.tsx
export const dynamic = 'force-dynamic'
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
    <main className="p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Novo cartão</h1>

        <form action={createCard} className="space-y-3">
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input name="name" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="Cartão Nubank" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Bandeira</label>
              <input name="brand" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="Visa, Mastercard..." />
            </div>
            <div>
              <label className="block text-sm mb-1">Final</label>
              <input name="last4" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="1234" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Instituição</label>
              <input name="institution" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="Banco emissor" />
            </div>
            <div>
              <label className="block text-sm mb-1">Limite (R$)</label>
              <input name="limit_amount" type="number" step="0.01" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="ex: 5000" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Dia de fechamento</label>
              <input name="closing_day" type="number" min={1} max={28} defaultValue={5} className="w-full px-3 py-2 border rounded-lg bg-neutral-50" />
            </div>
            <div>
              <label className="block text-sm mb-1">Dia de vencimento</label>
              <input name="due_day" type="number" min={1} max={28} className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="ex: 15" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Cor (hex)</label>
              <input name="color_hex" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="#8b5cf6" />
            </div>
            <div>
              <label className="block text-sm mb-1">Ícone (slug)</label>
              <input name="icon_slug" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="FaCreditCard" />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">Salvar</button>
            <Link href="/cards" className="px-4 py-2 border rounded-lg">Cancelar</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
