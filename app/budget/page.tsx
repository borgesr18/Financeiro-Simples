// app/budget/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { softDeleteAction } from '@/app/settings/trash/actions'

// Tipagem do que esperamos do Supabase
type BudgetRow = {
  id: string
  year: number
  month: number
  amount: number
  category_id: string
  categories: { name: string } | null
}

function clampMonth(y: number, m: number) {
  // normaliza ano/mês (ex.: 2025/0 => 2024/12)
  const d = new Date(y, m - 1, 1)
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

function prevYM(y: number, m: number) {
  const d = new Date(y, m - 2, 1)
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

function nextYM(y: number, m: number) {
  const d = new Date(y, m, 1)
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams?: { y?: string; m?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para visualizar seus orçamentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  // 1) Resolve ano/mês da URL (ou atual)
  const now = new Date()
  const y0 = Number(searchParams?.y ?? now.getFullYear())
  const m0 = Number(searchParams?.m ?? now.getMonth() + 1)
  const { y, m } = clampMonth(y0, m0)

  const labelMes = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const { y: py, m: pm } = prevYM(y, m)
  const { y: ny, m: nm } = nextYM(y, m)

  // 2) Busca budgets do mês (apenas não deletados)
  const { data, error } = await supabase
    .from('budgets')
    .select('id, year, month, amount, category_id, categories(name)')
    .eq('year', y)
    .eq('month', m)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[BudgetPage] erro ao carregar budgets:', error)
  }

  const rows = (data ?? []) as BudgetRow[]

  return (
    <main className="p-6 space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/budget?y=${py}&m=${pm}`}
            className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
          >
            ◀
          </Link>
          <h1 className="text-2xl font-semibold capitalize">{labelMes}</h1>
          <Link
            href={`/budget?y=${ny}&m=${nm}`}
            className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
          >
            ▶
          </Link>
        </div>

        <div className="flex gap-2">
          <Link
            href="/budget/new"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
          >
            Novo orçamento
          </Link>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4">Valor orçado</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    {b.categories?.name ?? '—'}
                  </td>
                  <td className="py-3 px-4">
                    {String(b.month).padStart(2, '0')}/{b.year}
                  </td>
                  <td className="py-3 px-4">{formatBRL(b.amount)}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/budget/${b.id}/edit`}
                        className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
                      >
                        Editar
                      </Link>

                      {/* Excluir -> Lixeira (soft delete) */}
                      <form action={softDeleteAction}>
                        <input type="hidden" name="entity" value="budgets" />
                        <input type="hidden" name="id" value={b.id} />
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
              ))}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-500">
                    Nenhum orçamento para {labelMes}. Crie um novo orçamento.
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
