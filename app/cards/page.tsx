// app/cards/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { softDeleteAction } from '@/app/settings/trash/trash-actions'
import { formatBRL } from '@/lib/format'

type Card = {
  id: string
  name: string | null
  brand: string | null
  last4: string | null
  limit_amount: number | null
  institution: string | null
  color_hex: string | null
  icon_slug: string | null
  archived: boolean | null
  deleted_at: string | null
}

export default async function CardsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar cartões.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('cards')
    .select('id, name, brand, last4, limit_amount, institution, color_hex, icon_slug, archived, deleted_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    console.error('[cards/page] list error:', error)
  }

  const cards: Card[] = data ?? []

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cartões</h1>
          <p className="text-sm text-neutral-500">
            {cards.length} cartão(is) ativo(s)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/cards/new" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">
            Novo cartão
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Cartão</th>
                <th className="py-3 px-4">Marca</th>
                <th className="py-3 px-4">Final</th>
                <th className="py-3 px-4">Limite</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-3 px-4">{c.name ?? '—'}</td>
                  <td className="py-3 px-4">{c.brand ?? '—'}</td>
                  <td className="py-3 px-4">{c.last4 ?? '—'}</td>
                  <td className="py-3 px-4">{formatBRL(c.limit_amount ?? 0)}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/cards/${c.id}/statements`} className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                        Faturas
                      </Link>
                      <Link href={`/cards/${c.id}/edit`} className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                        Editar
                      </Link>
                      <form action={softDeleteAction}>
                        <input type="hidden" name="entity" value="cards" />
                        <input type="hidden" name="id" value={c.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Lixeira
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Nenhum cartão cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

