// app/investments/[id]/edit/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateInvestment } from '../../actions'

type Investment = {
  id: string
  name: string | null
  type: string | null
  institution: string | null
  currency: string | null
  current_value: number | null
  color_hex: string | null
  icon_slug: string | null
}

export default async function EditInvestmentPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para editar investimentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('investments')
    .select('id, name, type, institution, currency, current_value, color_hex, icon_slug')
    .eq('user_id', user.id)
    .eq('id', params.id)
    .single()

  if (error) {
    console.error('[investments/edit] get error:', error)
  }
  if (!data) return notFound()

  const inv = data as Investment

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar investimento</h1>
        <Link href="/investments" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Voltar</Link>
      </div>

      <form action={updateInvestment} className="bg-white rounded-xl shadow-card p-6 space-y-4 max-w-xl">
        <input type="hidden" name="id" value={inv.id} />

        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input name="name" defaultValue={inv.name ?? ''} className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select name="type" defaultValue={inv.type ?? 'other'} className="w-full rounded-lg border px-3 py-2">
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
            <input name="institution" defaultValue={inv.institution ?? ''} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Moeda</label>
            <input name="currency" defaultValue={inv.currency ?? 'BRL'} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Cor</label>
            <input name="color_hex" defaultValue={inv.color_hex ?? ''} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Ícone (slug)</label>
            <input name="icon_slug" defaultValue={inv.icon_slug ?? ''} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>

        <div>
          <label className="block text-sm mb-1">Valor atual</label>
          <input name="current_value" type="number" step="0.01" defaultValue={inv.current_value ?? 0} className="w-full rounded-lg border px-3 py-2" />
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

