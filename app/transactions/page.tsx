import { createClient } from '@/lib/supabase/server'
import { brl } from '@/lib/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(start), to: iso(end) }
}

export default async function TransactionsPage({
  searchParams,
}: { searchParams?: { page?: string; type?: 'income' | 'expense' | 'all' } }) {
  const type = (searchParams?.type ?? 'all') as 'income' | 'expense' | 'all'
  const page = Number(searchParams?.page ?? 1)
  const pageSize = 20
  const fromIdx = (page - 1) * pageSize
  const toIdx = fromIdx + pageSize - 1

  const { from, to } = monthRange()
  const supabase = createClient()

  let query = supabase
    .from('transactions')
    .select('*', { count: 'exact' })
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  if (type !== 'all') {
    query = query.eq('type', type)
  }

  const { data, count, error } = await query.range(fromIdx, toIdx)
  if (error) {
    console.error(error)
  }

  const pages = Math.max(1, Math.ceil((count ?? 0) / pageSize))

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Lançamentos</h2>
          <p className="text-neutral-500">Período: mês atual</p>
        </div>
        <Link href="/add" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">Novo lançamento</Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-4 flex items-center gap-2">
        <form className="flex items-center gap-2">
          <select
            name="type"
            defaultValue={type}
            className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
            onChange={(e) => {
              const val = e.currentTarget.value
              const url = new URL(window.location.href)
              url.searchParams.set('type', val)
              url.searchParams.set('page', '1')
              window.location.assign(url.toString())
            }}
          >
            <option value="all">Todos</option>
            <option value="income">Entradas</option>
            <option value="expense">Saídas</option>
          </select>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="text-left px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-left px-4 py-3">Categoria</th>
              <th className="text-right px-4 py-3">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((t) => (
              <tr key={t.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3">{t.category ?? '—'}</td>
                <td className={`px-4 py-3 text-right font-medium ${t.amount < 0 ? 'text-danger' : 'text-success'}`}>
                  {brl(t.amount)}
                </td>
              </tr>
            ))}
            {!data?.length && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-neutral-500">Nenhum lançamento no período.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="mt-4 flex justify-between items-center text-sm">
        <div className="text-neutral-500">Total: {count ?? 0}</div>
        <div className="flex gap-2">
          <a
            className={`px-3 py-1.5 rounded border ${page <= 1 ? 'pointer-events-none opacity-50' : 'border-neutral-200 hover:bg-neutral-50'}`}
            href={`?type=${type}&page=${Math.max(1, page - 1)}`}
          >Anterior</a>
          <span className="px-3 py-1.5">{page} / {pages}</span>
          <a
            className={`px-3 py-1.5 rounded border ${page >= pages ? 'pointer-events-none opacity-50' : 'border-neutral-200 hover:bg-neutral-50'}`}
            href={`?type=${type}&page=${Math.min(pages, page + 1)}`}
          >Próxima</a>
        </div>
      </div>
    </main>
  )
}

