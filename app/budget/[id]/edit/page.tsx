// app/budget/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BudgetForm, { BudgetInitial } from '@/components/BudgetForm'

export const dynamic = 'force-dynamic'

type Params = { params: { id: string } }

export default async function EditBudgetPage({ params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4 text-neutral-700">Você precisa estar logado para editar uma meta.</p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent(`/budget/${params.id}/edit`)}`}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('budgets')
    .select('id, category, month, year, amount')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h2 className="text-xl font-semibold mb-2">Meta não encontrada</h2>
          <p className="text-neutral-600 mb-4">Não foi possível carregar a meta solicitada.</p>
          <Link href="/budget" className="text-primary-600 hover:underline">Voltar para Orçamentos</Link>
        </div>
      </main>
    )
  }

  const initial: BudgetInitial = {
    id: data.id,
    category: data.category,
    month: data.month,
    year: data.year,
    amount: data.amount,
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Editar meta</h2>
        <BudgetForm initial={initial} />
      </div>
    </main>
  )
}
