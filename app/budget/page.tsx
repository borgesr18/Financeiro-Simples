// app/budgets/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getBudgetsWithSpend } from '@/lib/budgets'
import BudgetBar from '@/components/BudgetBar'
import BudgetRowActions from '@/components/BudgetRowActions'
import { brl } from '@/lib/format'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function nowYM() {
  const d = new Date()
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}
function monthLabel(m: number) {
  return new Date(2000, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })
}
function qs(year: number, month: number) {
  return `?year=${year}&month=${month}`
}

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams?: { month?: string; year?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h2 className="text-xl font-semibold mb-2">Orçamentos</h2>
          <p className="text-neutral-600 mb-4">
            Faça login para ver e definir suas metas por categoria.
          </p>
          <Link
            href="/login"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Entrar
          </Link>
        </div>
      </main>
    )
  }

  const { y: y0, m: m0 } = nowYM()
  const y = Number(searchParams?.year ?? y0)
  const m = Number(searchParams?.month ?? m0)

  const lines = await getBudgetsWithSpend(supabase, y, m)

  const totalLimit = lines.reduce((s, l) => s + (l.amount || 0), 0)
  const totalSpent = lines.reduce((s, l) => s + (l.spent || 0), 0)

  const prev = new Date(y, m - 2, 1)
  const next = new Date(y, m, 1)

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
      {/* Cabeçalho e navegação de período */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800">Orçamentos</h2>
          <p className="text-neutral-500 capitalize">
            {monthLabel(m)} de {y}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/budgets${qs(
              prev.getFullYear(),
              prev.getMonth() + 1
            )}`}
            className="px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50"
          >
            ◀
          </Link>
          <Link
            href={`/budgets${qs(
              next.getFullYear(),
              next.getMonth() + 1
            )}`}
            className="px-3 py-1.5 rounded border border-neutral-200 hover:bg-neutral-50"
          >
            ▶
          </Link>
          <Link
            href={`/budgets/new${qs(y, m)}`}
            className="px-3 py-1.5 rounded bg-primary-500 text-white hover:bg-primary-600"
          >
            Nova meta
          </Link>
        </div>
      </div>

      {/* Cards totais */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="text-neutral-500 text-sm">Limite total</div>
          <div className="text-2xl font-bold text-neutral-800">
            {brl(totalLimit)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="text-neutral-500 text-sm">Gasto total</div>
          <div className="text-2xl font-bold text-danger">{brl(totalSpent)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="text-neutral-500 text-sm">Saldo das metas</div>
          <div
            className={`text-2xl font-bold ${
              totalLimit - totalSpent >= 0 ? 'text-neutral-800' : 'text-danger'
            }`}
          >
            {brl(totalLimit - totalSpent)}
          </div>
        </div>
      </section>

      {/* Lista de categorias com barras e ações */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lines.length ? (
          lines.map((l) => (
            <div key={`${l.category}-${l.id ?? 'noid'}`} className="space-y-2">
              <BudgetBar
                category={l.category}
                amount={l.amount}
                spent={l.spent}
                percent={l.percent}
                over={l.over}
              />

              {l.hasBudget && l.id ? (
                <BudgetRowActions id={l.id} />
              ) : (
                <div className="flex justify-end">
                  <a
                    href={`/budgets/new?category=${encodeURIComponent(
                      l.category
                    )}&year=${y}&month=${m}&amount=${l.spent || 0}`}
                    className="text-sm text-primary-600 hover:underline"
                  >
                    Criar meta para “{l.category}”
                  </a>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3">
            <div className="p-6 bg-white border border-neutral-200 rounded-xl text-neutral-600">
              Nenhuma meta definida para este mês.
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
