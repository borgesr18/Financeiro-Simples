// app/cards/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'

type CardRow = {
  id: string
  name: string
  brand: string | null
  last4: string | null
  institution: string | null
  archived: boolean
  account_id: string | null
}

type BalanceRow = {
  account_id: string
  name: string
  type: string
  archived: boolean
  balance: number
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

  const { data: cardsData } = await supabase
    .from('cards')
    .select('id, name, brand, last4, institution, archived, account_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const cards = (cardsData ?? []) as CardRow[]

  const { data: balancesData } = await supabase
    .from('v_account_balances')
    .select('account_id, name, type, archived, balance')
    .eq('user_id', user.id)

  const balances = (balancesData ?? []) as BalanceRow[]

  const balMap = new Map(balances.map(b => [b.account_id, b]))

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cartões</h1>
        <Link href="/cards/new" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">
          Novo cartão
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Cartão</th>
                <th className="py-3 px-4">Instituição</th>
                <th className="py-3 px-4">Final</th>
                <th className="py-3 px-4">Saldo</th>
                <th className="py-3 px-4 w-48"></th>
              </tr>
            </thead>
            <tbody>
              {cards.map((c) => {
                const bal = c.account_id ? balMap.get(c.account_id) : undefined
                const value = bal ? Number(bal.balance) || 0 : 0
                const isDebt = value < 0
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-3 px-4">{c.name}{c.brand ? ` • ${c.brand}` : ''}</td>
                    <td className="py-3 px-4">{c.institution ?? '—'}</td>
                    <td className="py-3 px-4">{c.last4 ?? '—'}</td>
                    <td className={`py-3 px-4 ${isDebt ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatBRL(value)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/cards/${c.id}/statements`} className="px-3 py-1.5 border rounded-lg hover:bg-neutral-50">
                          Faturas
                        </Link>
                        <Link href={`/cards/${c.id}/edit`} className="px-3 py-1.5 border rounded-lg hover:bg-neutral-50">
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {cards.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">Nenhum cartão cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
