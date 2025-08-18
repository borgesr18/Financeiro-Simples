// app/cards/[id]/edit/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCard } from '../../actions'

type Card = {
  id: string
  name: string | null
  brand: string | null
  last4: string | null
  limit_amount: number | null
  closing_day: number | null
  due_day: number | null
  institution: string | null
  color_hex: string | null
  icon_slug: string | null
  archived: boolean | null
}

export default async function EditCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para editar cartões.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('cards')
    .select('id, name, brand, last4, limit_amount, closing_day, due_day, institution, color_hex, icon_slug, archived')
    .eq('user_id', user.id)
    .eq('id', params.id)
    .single()

  if (error) {
    console.error('[cards/edit] get error:', error)
  }
  if (!data) return notFound()

  const c = data as Card

  // wrapper para casar com a assinatura updateCard(id, fd)
  const doUpdate = async (fd: FormData) => {
    'use server'
    const { updateCard } = await import('../../actions')
    await updateCard(c.id, fd)
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar cartão</h1>
        <Link href="/cards" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Voltar</Link>
      </div>

      <form action={doUpdate} className="bg-white rounded-xl shadow-card p-6 space-y-4 max-w-xl">
        <div>
          <label className="block text-sm mb-1">Nome</label>
          <input name="name" defaultValue={c.name ?? ''} className="w-full rounded-lg border px-3 py-2" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Marca</label>
            <input name="brand" defaultValue={c.brand ?? ''} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Final</label>
            <input name="last4" defaultValue={c.last4 ?? ''} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Instituição</label>
            <input name="institution" defaultValue={c.institution ?? ''} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Limite</label>
            <input name="limit_amount" type="number" step="0.01" defaultValue={c.limit_amount ?? 0} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Fechamento (1–28)</label>
            <input name="closing_day" type="number" min={1} max={28} defaultValue={c.closing_day ?? 5} className="w-full rounded-lg border px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Vencimento (1–28)</label>
            <input name="due_day" type="number" min={1} max={28} defaultValue={c.due_day ?? 12} className="w-full rounded-lg border px-3 py-2" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input id="archived" name="archived" type="checkbox" defaultChecked={!!c.archived} />
          <label htmlFor="archived" className="text-sm">Arquivado</label>
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
