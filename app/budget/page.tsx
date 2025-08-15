// app/budget/page.tsx
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
function qs(y: number, m: number) {
  return `?year=${y}&month=${m}`
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4 text-neutral-700">Você precisa estar logado para ver as metas.</p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent('/budget')}`}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const { y: yNow, m: mNow } = nowYM()
  const y = Number(searchParams?.year ?? yNow)
  const m = Number(searchParams?.month ?? mNow)

  let lines = []
  try {
    lines = await getBudgetsWithSpend(supabase, user.id, y, m)
  } catch (e) {
    console.error('Erro ao carregar budgets:', e)
  }

  const prev = new Date(y, m - 2, 1)
  const next = new Date(y, m, 1)

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Orçamentos por categoria</h2>
            <p className="text-sm text-neutral-500">
              {monthLabel(m)} de {y}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/budget${qs(prev.getFullYear(), prev.getMonth() + 1)}`}
              className="px-3 py-1.5 bg-white text-neutral-600 rounded-lg text-sm font-medium border border-neutral-200"
            >
              ← Anterior
            </Link>
            <Link
              href={`/budget${qs(next.getFullYear(), next.getMonth() + 1)}`}
              className="px-3 py-1.5 bg-white text-neutral-600 rounded-lg text-sm font-medium border border-neutral-200"
            >
              Próximo →
            </Link>
            <Link
              href={`/budget/new${qs(y, m)}`}
              className="px-3 py-1.5 bg-primary-500 text-white rounded-lg text-sm font-medium"
            >
              Nova meta
            </Link>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl shadow-card divide-y divide-neutral-100">
          {lines.length === 0 ? (
            <div className="p-6 text-neutral-600">
              Nenhuma meta cadastrada ainda.
              <Link href={`/budget/new${qs(y, m)}`} className="ml-2 text-primary-600 hover:underline">
                Criar primeira meta
              </Link>
            </div>
          ) : (
            lines.map((l) => (
              <div key={`${l.category}-${l.id ?? 'noid'}`} className="p-5 flex items-center justify-between">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-neutral-800">{l.category}</span>
                    {l.over && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-danger border border-red-100">
                        Estourado
                      </span>
                    )}
                  </div>
                  <BudgetBar spent={l.spent} amount={l.amount} />
                  <div className="text-sm text-neutral-500">
                    Gasto: <span className="text-neutral-800">{brl(l.spent)}</span>
                    <span className="mx-1">•</span>
                    Meta: <span className="text-neutral-800">{brl(l.amount)}</span>
                    {l.amount > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        Usado: <span className={l.over ? 'text-danger' : 'text-neutral-800'}>
                          {Math.min(999, Math.round(l.percent))}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {l.hasBudget ? (
                    <>
                      {/* Editar (rota opcional abaixo) */}
                      <Link
                        href={`/budget/${l.id}/edit${qs(y, m)}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        Editar
                      </Link>
                      <BudgetRowActions id={String(l.id)} />
                    </>
                  ) : (
                    <Link
                      href={`/budget/new?category=${encodeURIComponent(l.category)}&year=${y}&month=${m}&amount=${l.spent || 0}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Definir meta
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  )
}
