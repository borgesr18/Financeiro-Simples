// app/(app)/goals/[id]/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGoalDetail } from '@/lib/goals'
import ContributionForm from '@/components/ContributionForm'

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const data = await getGoalDetail(params.id)
  if (!data) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Meta não encontrada.</p>
          <Link href="/goals" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Voltar</Link>
        </div>
      </main>
    )
  }

  const { goal, contribs, current } = data
  const remaining = Number(goal.target_amount) - Number(current)

  return (
    <main className="p-6 space-y-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-6">
        <div className="flex items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{goal.name}</h1>
            <p className="text-sm text-neutral-500">
              Alvo: R$ {Number(goal.target_amount).toFixed(2)} · Atual: R$ {current.toFixed(2)} · Falta: R$ {remaining.toFixed(2)}
            </p>
          </div>
          <Link href="/goals" className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Voltar</Link>
        </div>

        <div className="mt-4">
          <div className="w-full h-2 bg-neutral-200 rounded">
            <div className="h-2 bg-emerald-500 rounded" style={{ width: `${Math.min(100, (current / Number(goal.target_amount)) * 100)}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-3">Aportes</h2>
          {contribs.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhum aporte ainda.</p>
          ) : (
            <ul className="divide-y">
              {contribs.map(c => (
                <li key={c.id} className="py-2 flex items-center justify-between">
                  <span className="text-sm">
                    {new Date(c.date).toLocaleDateString()} — R$ {Number(c.amount).toFixed(2)}
                    {c.notes ? <span className="text-neutral-500"> · {c.notes}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-3">Adicionar aporte</h2>
          <ContributionForm goalId={goal.id} />
        </div>
      </div>
    </main>
  )
}
