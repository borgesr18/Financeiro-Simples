// app/(app)/goals/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getGoalsWithProgress } from '@/lib/goals'
import { deleteGoal } from './actions'

export default async function GoalsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar metas.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const goals = await getGoalsWithProgress()

  return (
    <main className="p-6">
      <div className="flex items-start sm:items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Metas</h1>
          <p className="text-sm text-neutral-500">Acompanhe seu progresso</p>
        </div>
        <Link href="/goals/new" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">
          Nova meta
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Meta</th>
                <th className="py-3 px-4">Alvo</th>
                <th className="py-3 px-4">Atual</th>
                <th className="py-3 px-4">Progresso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {goals.map(g => {
                const diff = Number(g.target_amount) - Number(g.current_amount)
                return (
                  <tr key={g.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <Link href={`/goals/${g.id}`} className="hover:underline">{g.name}</Link>
                    </td>
                    <td className="py-3 px-4">R$ {g.target_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">R$ {g.current_amount.toFixed(2)}</td>
                    <td className="py-3 px-4">
                      <div className="w-48 h-2 bg-neutral-200 rounded">
                        <div
                          className="h-2 bg-emerald-500 rounded"
                          style={{ width: `${g.percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-neutral-500 ml-2">{g.percent.toFixed(0)}%</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/goals/${g.id}`} className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                          Detalhes
                        </Link>
                        <form action={deleteGoal}>
                          <input type="hidden" name="id" value={g.id} />
                          <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {goals.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Nenhuma meta cadastrada.
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
