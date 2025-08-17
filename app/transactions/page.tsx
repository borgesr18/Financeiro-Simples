// app/transactions/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { softDeleteAction } from '@/app/settings/trash/actions'

type Row = {
  id: string
  date: string
  description: string | null
  amount: number
  type: 'income' | 'expense' | string
  categories?: { name: string }[] | { name: string } | null
  accounts?: { name: string }[] | { name: string } | null
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-BR')
  } catch {
    return iso
  }
}

export default async function TransactionsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para visualizar seus lançamentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  // Buscar lançamentos (somente não apagados)
  const { data, error } = await supabase
    .from('transactions')
    .select('id,date,description,amount,type,categories(name),accounts(name)')
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(500)

  if (error) {
    console.error('[transactions/page] load error:', error)
  }

  const rows: Row[] = (data ?? []) as Row[]

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lançamentos</h1>
          <p className="text-sm text-neutral-500">
            {rows.length} registro{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/add" className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg">
            Novo lançamento
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const catName = Array.isArray(r.categories)
                  ? r.categories[0]?.name
                  : (r.categories as { name: string } | null)?.name
                const accName = Array.isArray(r.accounts)
                  ? r.accounts[0]?.name
                  : (r.accounts as { name: string } | null)?.name
                const positive = (r.amount ?? 0) >= 0

                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-3 px-4 whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="py-3 px-4">{r.description || '—'}</td>
                    <td className="py-3 px-4">{catName || '—'}</td>
                    <td className="py-3 px-4">{accName || '—'}</td>
                    <td className="py-3 px-4">
                      {r.type === 'income' ? 'Entrada' : r.type === 'expense' ? 'Saída' : r.type}
                    </td>
                    <td className={`py-3 px-4 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatBRL(r.amount ?? 0)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        {/* Se tiver página de edição de lançamento, deixe aqui:
                        <Link href={`/transactions/${r.id}/edit`} className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                          Editar
                        </Link>
                        */}
                        <form action={softDeleteAction}>
                          <input type="hidden" name="entity" value="transactions" />
                          <input type="hidden" name="id" value={r.id} />
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
                  <td colSpan={7} className="py-6 text-center text-neutral-500">
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
