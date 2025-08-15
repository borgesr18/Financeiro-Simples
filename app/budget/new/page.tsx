// app/budget/new/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import BudgetForm from '@/components/BudgetForm'

export const dynamic = 'force-dynamic'

export default async function NewBudgetPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4 text-neutral-700">Você precisa estar logado para criar uma meta.</p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent('/budget/new')}`}  // <-- corrigido
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Nova meta / orçamento</h2>
        <BudgetForm />
      </div>
    </main>
  )
}
