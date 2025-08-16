// app/transactions/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'

type CatObj = { name: string }
type AccObj = { name: string }

// O Supabase pode retornar o relacionamento como objeto ou array.
// Tipamos de forma flexível e normalizamos ao mostrar na tabela.
type RowRaw = {
  id: string
  date: string
  description: string
  amount: number
  type: 'expense' | 'income'
  categories?: CatObj | CatObj[] | null
  accounts?: AccObj | AccObj[] | null
}

function getName<T extends { name: string }>(
  v: T | T[] | null | undefined,
  fallback = '—'
) {
  if (!v) return fallback
  if (Array.isArray(v)) return v[0]?.name ?? fallback
  return v.name ?? fallback
}

export default async function TransactionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para visualizar os lançamentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const { data } = await supabase
    .from('transactions')
    .select(
      'id, date, description, amount, type, categories:category_id(name), accounts:account_id(name)'
    )
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(500)

  // Tipagem tolerante ao formato do Supabase
  const rows = (data ?? []) as unknown as RowRaw[]

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <Link
          href="/add"
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
        >
          Novo lançamento
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tx) => {
                const positive = (tx.amount ?? 0) >= 0
                const catName = getName(tx.categories)
                const accName = getName(tx.accounts)

                return (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      {new Date(tx.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">{tx.description}</td>
                    <td className="py-3 px-4">{catName}</td>
                    <td className="py-3 px-4">{accName}</td>
                    <td
                      className={`py-3 px-4 ${
                        positive ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatBRL(tx.amount)}
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Nenhum lançamento encontrado.
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

