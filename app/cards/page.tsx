// app/cards/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AccountIcon } from '@/components/account-icons'
import { formatBRL } from '@/lib/format'
import { softDeleteAction } from '@/app/settings/trash/actions'

type UIRow = {
  id: string
  name: string
  brand: string
  last4: string
  limit_amount: number
  closing_day: number | null
  due_day: number | null
  color_hex: string | null
  icon_slug: string | null
  account_name: string
}

export default async function CardsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar cartões.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('cards')
    .select('id, name, brand, last4, limit_amount, closing_day, due_day, color_hex, icon_slug, accounts(name)')
    .is('deleted_at', null) // só ativos
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[CardsPage] erro ao carregar cartões:', error)
  }

  const rows: UIRow[] = (data ?? []).map((c: any) => {
    const acc = Array.isArray(c?.accounts) ? c.accounts[0] : c?.accounts
    return {
      id: String(c.id),
      name: String(c.name ?? 'Sem nome'),
      brand: String(c.brand ?? '—'),
      last4: String(c.last4 ?? '—'),
      limit_amount: Number(c.limit_amount ?? 0),
      closing_day: c.closing_day ?? null,
      due_day: c.due_day ?? null,
      color_hex: c.color_hex ?? null,
      icon_slug: c.icon_slug ?? null,
      account_name: acc?.name ?? '—',
    }
  })

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Cartões</h1>
          <p className="text-sm text-neutral-500">
            {rows.length} {rows.length === 1 ? 'cartão' : 'cartões'}
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
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Cartão</th>
                <th className="py-3 px-4">Bandeira</th>
                <th className="py-3 px-4">****</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">Limite</th>
                <th className="py-3 px-4">Fechamento</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const color = c.color_hex || '#e5e7eb'
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.08)' }}
                          title={c.name}
                        >
                          <AccountIcon slug={c.icon_slug} className="text-[18px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{c.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{c.brand}</td>
                    <td className="py-3 px-4">{c.last4}</td>
                    <td className="py-3 px-4">{c.account_name}</td>
                    <td className="py-3 px-4">{formatBRL(c.limit_amount)}</td>
                    <td className="py-3 px-4">{c.closing_day ?? '—'}</td>
                    <td className="py-3 px-4">{c.due_day ?? '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/cards/${c.id}/edit`}
                          className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
                        >
                          Editar
                        </Link>

                        {/* Excluir -> Lixeira */}
                        <form action={softDeleteAction}>
                          <input type="hidden" name="entity" value="cards" />
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50"
                          >
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-neutral-500">
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

