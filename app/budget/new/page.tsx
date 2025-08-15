// app/budgets/new/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function NewBudgetPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
          <p className="mb-4">Você precisa estar logado para criar um orçamento.</p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent('/budgets/new')}`}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Nova Meta/Orçamento</h2>
        {/* Formulário de criação de orçamento */}
        <form>
          <div className="mb-4">
            <label className="block mb-1">Categoria</label>
            <input type="text" className="w-full border rounded px-3 py-2" />
          </div>
          <div className="mb-4">
            <label className="block mb-1">Valor (R$)</label>
            <input type="number" className="w-full border rounded px-3 py-2" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Salvar
          </button>
        </form>
      </div>
    </main>
  )
}
