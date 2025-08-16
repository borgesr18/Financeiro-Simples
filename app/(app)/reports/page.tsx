// app/(app)/reports/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BudgetVsActualTable, { BudgetRow } from '@/components/reports/BudgetVsActualTable'
import { formatBRL } from '@/lib/format'

type BudgetRowRaw = {
  id: string
  category_id: string | null
  amount: number
  categories?: { name: string } | null
}

type TxRow = {
  id: string
  date: string
  amount: number
  category_id: string | null
  type: 'expense' | 'income'
}

function getMonthBounds(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth() // 0-11
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { year: y, month: m + 1, startISO: toISO(start), endISO: toISO(end) }
}

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para ver relatórios.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const { year, month, startISO, endISO } = getMonthBounds()

  // 1) Budgets do mês atual
  const { data: budgetsData } = await supabase
    .from('budgets')
    .select('id, category_id, amount, categories:category_id(name)')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)

  const budgets = (budgetsData ?? []) as BudgetRowRaw[]

  // 2) Transações do mês atual (vamos agregar em código)
  const { data: txData } = await supabase
    .from('transactions')
    .select('id, date, amount, category_id, type')
    .eq('user_id', user.id)
    .gte('date', startISO)
    .lte('date', endISO)
    .limit(5000)

  const txs = (txData ?? []) as TxRow[]

  // Mapa de gasto por categoria (somando despesas como positivos)
  const spentByCat = new Map<string, number>()
  for (const t of txs) {
    if (t.amount < 0) {
      const cid = t.category_id ?? '__none__'
      const prev = spentByCat.get(cid) ?? 0
      spentByCat.set(cid, prev + Math.abs(Number(t.amount) || 0))
    }
  }

  // Mapa do planejado por categoria
  const plannedByCat = new Map<string, { amount: number; name: string }>()
  for (const b of budgets) {
    const cid = b.category_id ?? '__none__'
    const prev = plannedByCat.get(cid)?.amount ?? 0
    const name = b.categories?.name ?? '—'
    plannedByCat.set(cid, { amount: prev + (Number(b.amount) || 0), name })
  }

  // Conjunto de todas as categorias presentes (planejado ou gasto)
  const allCatIds = new Set<string>([
    ...Array.from(plannedByCat.keys()),
    ...Array.from(spentByCat.keys()),
  ])

  // Constrói linhas para a tabela
  const bvaRows: BudgetRow[] = Array.from(allCatIds).map((cid) => {
    const planned = plannedByCat.get(cid)?.amount ?? 0
    const name = plannedByCat.get(cid)?.name ?? '—'
    const spent = spentByCat.get(cid) ?? 0
    return {
      category: name,
      amount: planned,
      spent,
      percent: planned > 0 ? (spent / planned) * 100 : undefined,
    }
  }).sort((a, b) => (b.spent - b.amount) - (a.spent - a.amount)) // ordena por estouro

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  const totalPlanned = bvaRows.reduce((acc, r) => acc + (r.amount || 0), 0)
  const totalSpent = bvaRows.reduce((acc, r) => acc + (r.spent || 0), 0)
  const diff = totalPlanned - totalSpent

  return (
    <main className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Relatórios</h1>
            <p className="text-sm text-neutral-500">Período: {monthLabel}</p>
          </div>
          <Link
            href="/budget"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
          >
            Ver orçamentos
          </Link>
        </header>

        {/* Resumo do mês */}
        <section className="bg-white rounded-xl shadow-card p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-neutral-500">Planejado</div>
            <div className="text-lg font-semibold">{formatBRL(totalPlanned)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Gasto</div>
            <div className="text-lg font-semibold text-rose-600">{formatBRL(totalSpent)}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500">Diferença</div>
            <div className={`text-lg font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatBRL(diff)}
            </div>
          </div>
        </section>

        {/* Orçamento vs Realizado */}
        <section>
          <h2 className="text-lg font-semibold">Orçamento vs Realizado — {monthLabel}</h2>
          <BudgetVsActualTable rows={bvaRows} />
        </section>
      </div>
    </main>
  )
}


