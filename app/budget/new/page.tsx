// app/budget/new/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createBudget } from '../actions'

export default async function BudgetNewPage({
  searchParams,
}: {
  searchParams?: { category?: string; year?: string; month?: string; amount?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4 text-neutral-700">Você precisa estar logado para criar uma meta.</p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent('/budget/new')}`}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const now = new Date()
  const y = Number.isFinite(Number(searchParams?.year)) ? Number(searchParams?.year) : now.getFullYear()
  const m = Number.isFinite(Number(searchParams?.month)) ? Number(searchParams?.month) : now.getMonth() + 1

  // 🔧 Wrapper que retorna Promise<void>
  const doCreate = async (formData: FormData) => {
    'use server'
    await createBudget(formData)
  }

  return (
    <main className="flex-1 p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-800">Nova meta</h2>
          <Link href={`/budget?year=${y}&month=${m}`} className="text-sm text-neutral-600 hover:underline">
            Voltar
          </Link>
        </div>

        <form action={doCreate} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Categoria</label>
            <input
              name="category"
              defaultValue={searchParams?.category ?? ''}
              required
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Ano</label>
              <input
                type="number"
                name="year"
                min={2000}
                max={2100}
                defaultValue={y}
                required
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Mês</label>
              <input
                type="number"
                name="month"
                min={1}
                max={12}
                defaultValue={m}
                required
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-600 mb-1">Valor da meta</label>
            <input
              type="number"
              name="amount"
              min={0}
              step="0.01"
              defaultValue={Number(searchParams?.amount ?? 0)}
              required
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Salvar
            </button>
            <Link
              href={`/budget?year=${y}&month=${m}`}
              className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
