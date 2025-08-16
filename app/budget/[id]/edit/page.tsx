// app/budget/[id]/edit/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BudgetEditForm from '@/components/BudgetEditForm'

export default async function EditBudgetPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: budget } = await supabase
    .from('budgets')
    .select('id, category_id, year, month, amount')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!budget) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Orçamento não encontrado.</p>
          <Link href="/budget" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Voltar</Link>
        </div>
      </main>
    )
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')

  return (
    <main className="p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Editar orçamento</h2>
        <BudgetEditForm
          id={budget.id}
          initial={{
            category_id: budget.category_id,
            year: budget.year,
            month: budget.month,
            amount: budget.amount,
          }}
          categories={categories ?? []}
        />
      </div>
    </main>
  )
}

