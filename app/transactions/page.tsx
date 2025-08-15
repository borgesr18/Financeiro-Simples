// app/transactions/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { brl } from '@/lib/format'
import TransactionsFilters from '@/components/TransactionsFilters'
import TransactionRowActions from '@/components/TransactionRowActions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type TxType = 'income' | 'expense' | 'all'

type TxRow = {
  id: string
  date: string
  description: string
  amount: number
  type: 'income' | 'expense'
  category_id?: string | null
  categories?: { name: string } | null
  created_at?: string
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(start), to: iso(end) }
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams?: { page?: string; type?: TxType }
}) {
  const type = (searchParams?.type ?? 'all') as TxType
  const page = Math.max(1, Number(searchParams?.page ?? 1))
  const pageSize = 20
  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1

  const { from, to } = monthRange()
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="text-neutral-700 mb-4">Você precisa estar logado para ver seus lançamentos.</p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent('/transactions')}`}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  // Base query com join em categories(name)
  let base = supabase
    .from('transactions')
    .select('id, date, description, amount, type, category_id, categories(name), created_at', { count: 'exact' })
    .eq('user_id', user.id)
    .gte('date', from)
    .lte('date', to)

  if (type !== 'all') {
    base = base.eq('type', type)
  }

  const { data, count, error } = await base
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(fromIdx, toIdx)

  if (error) {
    console.error('[transactions] fetch error:', error)
  }

  const rows: TxRow[] = Array.isArray(data) ? (data as TxRow[]) : []
  const total = count ?? 0
  const pages = Math.max(1, Math.ceil(total / pageSize))

  // Helpers para paginação preservando o filtro "type"
  const hrefFor = (p: number) => {
    const params = new URLSearchParams()
    params.set('type', type)
    params.set('page', String(p))
    return `?${params.toString()}`
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Lançamentos</h2>
          <p className="text-neutral-500">Período: mês atual</p>
        </div>
        <Link
          href="/add"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Novo lançamento
        </Link>
      </div>

      {/* Filtros (Client Component) */}
      <TransactionsFilters type={type} />

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Categoria</th>
              <th className="text-right px-4 py-3">Valor</th>
              <th className="text-right px-4 py-3 w-40">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => {
              const amount = Number(t.amount)
              const isNegative = amount < 0 || t.type === 'expense'
              return (
                <tr key={t.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    {new Date(t.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">{t.description}</td>
                  <td className="px-4 py-3">{t.categories?.name ?? '—'}</td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      isNegative ? 'text-danger' : 'text-success'
                    }`}
                  >
                    {brl(amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <TransactionRowActions id={t.id} />
                  </td>
                </tr>
              )
            })}
            {!rows.length && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  Nenhum lançamento no período.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="mt-4 flex justify-between items-center text-sm">
        <div className="text-neutral-500">Total: {total}</div>
        <div className="flex gap-2 items-center">
          <Link
            aria-disabled={page <= 1}
            className={`px-3 py-1.5 rounded border ${
              page <= 1
                ? 'pointer-events-none opacity-50 border-neutral-200'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
            href={hrefFor(Math.max(1, page - 1))}
          >
            Anterior
          </Link>
          <span className="px-3 py-1.5">
            {page} / {pages}
          </span>
          <Link
            aria-disabled={page >= pages}
            className={`px-3 py-1.5 rounded border ${
              page >= pages
                ? 'pointer-events-none opacity-50 border-neutral-200'
                : 'border-neutral-200 hover:bg-neutral-50'
            }`}
            href={hrefFor(Math.min(pages, page + 1))}
          >
            Próxima
          </Link>
        </div>
      </div>
    </main>
  )
}


