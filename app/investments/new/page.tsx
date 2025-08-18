// app/investments/new/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createInvestment } from '../actions'

export default async function NewInvestmentPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para criar investimentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Novo investimento</h1>
        <Link href="/investments" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Voltar</Link>
      </div>

      <form action={createInvestment} className="bg-white rounded-xl shadow-card p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input name="name" className="w-full rounded-lg border px-3 py-2" placeholder="Tesouro Selic / ITSA4 / ..." />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select name="type" className="w-full rounded-lg border px-3 py-2">
              <option value="fixed">Renda fixa</option>
              <option value="stock">Ação</option>
              <option value="fund">Fundo</option>
              <option value="crypto">Cripto</option>
              <option value="realestate">Imobiliário</option>
              <option value="other">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Instituição</label>
            <input name="institution" className="w-full rounded-lg border px-3 py-2" placeholder="Corretora/Banco" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Moeda</label>
            <input name="currency" defaultValue="BRL" className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Cor</label>
            <input name="color_hex" className="w-full rounded-lg border px-3 py-2" placeholder="#0ea5e9" />
          </div>
          <div>
            <label className="block text-sm mb-1">Ícone (slug)</label>
            <input name="icon_slug" className="w-full rounded-lg border px-3 py-2" placeholder="trending-up" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Valor atual</label>
          <input name="current_value" type="number" step="0.01" className="w-full rounded-lg border px-3 py-2" placeholder="0,00" />
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


