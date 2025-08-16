// app/goals/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'

type GoalAny = Record<string, any>

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export default async function GoalsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar metas.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  // Pegamos qualquer coluna existente para evitar erros de schema
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[goals] erro ao carregar:', error)
  }

  const rows = (data ?? []) as GoalAny[]

  // Normalização: tenta vários nomes comuns de colunas
  const normalized = rows.map((g) => {
    const title = (g.title ?? g.name ?? g.description ?? 'Meta') as string
    const target = toNumber(g.target_amount ?? g.amount ?? g.value ?? 0)
    const saved  = toNumber(g.saved_amount ?? g.saved ?? g.current ?? 0)
    const remaining = Math.max(target - saved, 0)
    const percent = target > 0 ? Math.min((saved / target) * 100, 100) : 0
    const due = g.due_date ?? g.deadline ?? null
    return { id: g.id as string, title, target, saved, remaining, percent, due }
  })

  const totalTarget = normalized.reduce((a, r) => a + r.target, 0)
  const totalSaved  = normalized.reduce((a, r) => a + r.saved, 0)
  const totalRem    = Math.max(totalTarget - totalSaved, 0)

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Metas</h1>
        <Link
          href="/goals/new"
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
        >
          Nova meta
        </Link>
      </div>

      {/* Resumo */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Total de metas</div>
          <div className="text-lg font-semibold">{formatBRL(totalTarget)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Já poupado</div>
          <div className="text-lg font-semibold text-emerald-600">{formatBRL(totalSaved)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Faltante</div>
          <div className="text-lg font-semibold text-rose-600">{formatBRL(totalRem)}</div>
        </div>
      </section>

      {/* Lista */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Suas metas</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Meta</th>
                <th className="py-3 px-4">Objetivo</th>
                <th className="py-3 px-4">Poupado</th>
                <th className="py-3 px-4">Falta</th>
                <th className="py-3 px-4">Progresso</th>
                <th className="py-3 px-4">Prazo</th>
                <th className="py-3 px-4 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {normalized.map((g) => (
                <tr key={g.id} className="border-b last:border-0">
                  <td className="py-3 px-4">{g.title}</td>
                  <td className="py-3 px-4">{formatBRL(g.target)}</td>
                  <td className="py-3 px-4 text-emerald-600">{formatBRL(g.saved)}</td>
                  <td className="py-3 px-4 text-rose-600">{formatBRL(g.remaining)}</td>
                  <td className="py-3 px-4">
                    <div className="w-40">
                      <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className="h-2 bg-primary-500"
                          style={{ width: `${g.percent}%` }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {g.percent.toFixed(0)}%
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {g.due ? new Date(g.due).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/goals/${g.id}/edit`}
                        className="px-3 py-1.5 border rounded-lg hover:bg-neutral-50"
                      >
                        Editar
                      </Link>
                      <form action={`/goals/${g.id}/delete`} method="post">
                        <button className="px-3 py-1.5 text-rose-600 hover:underline">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {normalized.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-neutral-500">
                    Nenhuma meta cadastrada ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

