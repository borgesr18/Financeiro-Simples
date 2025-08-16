// app/budget/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getBudgetsWithSpend, type BudgetLine } from '@/lib/budgets'
import { deleteBudget } from './actions'

export default async function BudgetPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar orçamentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  const lines: BudgetLine[] = await getBudgetsWithSpend(year, month)

  return (
    <main className="p-6">
      <div className="flex items-start sm:items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Orçamentos</h1>
          <p className="text-sm text-neutral-500">Período: mês atual</p>
        </div>
        <Link
          href="/budget/new"
          className="inline-flex items-center px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
        >
          Novo orçamento
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Planejado</th>
                <th className="py-3 px-4">Gasto</th>
                <th className="py-3 px-4">Diferença</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => {
                const diff = l.amount - l.spent
                const canEdit = l.hasBudget && !String(l.id).startsWith('tx-')

                return (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-3 px-4">{l.category}</td>
                    <td className="py-3 px-4">R$ {l.amount.toFixed(2)}</td>
                    <td className="py-3 px-4">R$ {l.spent.toFixed(2)}</td>
                    <td className={`py-3 px-4 ${diff < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      R$ {diff.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        {canEdit ? (
                          <>
                            <Link
                              href={`/budget/${l.id}/edit`}  // <- EDIT
                              className="px-3 py-1.5 rounded-lg border text-neutral-700 hover:bg-neutral-50"
                            >
                              Editar
                            </Link>
                            <form action={deleteBudget}>
                              <input type="hidden" name="id" value={String(l.id)} />
                              <button
                                className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50"
                                type="submit"
                              >
                                Excluir
                              </button>
                            </form>
                          </>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {lines.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Nenhum orçamento cadastrado para o mês atual.
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



