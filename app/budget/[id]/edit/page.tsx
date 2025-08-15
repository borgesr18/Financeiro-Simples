// app/budget/[id]/edit/page.tsx
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateBudget, deleteBudget } from '../../actions'

type Category = { id: string; name: string }
type Budget = {
  id: string
  category_id: string | null
  category: string | null
  year: number
  month: number
  amount: number
}

export default async function BudgetEditPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { year?: string; month?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="flex-1 p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4 text-neutral-700">Você precisa estar logado para editar a meta.</p>
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

  // Carrega a meta garantindo ownership
  const { data: budgetRaw } = await supabase
    .from('budgets')
    .select('id, category_id, category, year, month, amount')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  const budget = (budgetRaw ?? null) as Budget | null
  if (!budget) notFound()

  // Carrega categorias para o dropdown e garante array tipado
  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true })

  const categories: Category[] = Array.isArray(categoriesRaw) ? (categoriesRaw as Category[]) : []

  const y = Number.isFinite(Number(searchParams?.year)) ? Number(searchParams?.year) : budget.year
  const m = Number.isFinite(Number(searchParams?.month)) ? Number(searchParams?.month) : budget.month

  // Wrappers server-only compatíveis com <form action>
  const doUpdate = async (formData: FormData) => {
    'use server'
    await updateBudget(formData)
  }

  const doDelete = async (formData: FormData) => {
    'use server'
    await deleteBudget(formData)
  }

  return (
    <main className="flex-1 p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-800">Editar meta</h2>
          <Link href={`/budget?year=${y}&month=${m}`} className="text-sm text-neutral-600 hover:underline">
            Voltar
          </Link>
        </div>

        <form action={doUpdate} className="space-y-4">
          <input type="hidden" name="id" defaultValue={budget.id} />

          <div>
            <label className="block text-sm text-neutral-600 mb-1">Categoria</label>
            <select
              name="category_id"
              defaultValue={budget.category_id ?? ''}
              required
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {/* Opcional: mostrar categoria legada em texto, se existir */}
            {!budget.category_id && budget.category ? (
              <p className="text-xs text-neutral-500 mt-1">
                Categoria antiga: <span className="text-neutral-700">{budget.category}</span>
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Ano</label>
              <input
                type="number"
                name="year"
                min={2000}
                max={2100}
                defaultValue={budget.year}
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
                defaultValue={budget.month}
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
              defaultValue={budget.amount}
              required
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
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

        <form action={doDelete} className="pt-2">
          <input type="hidden" name="id" defaultValue={budget.id} />
          <input type="hidden" name="year" defaultValue={y} />
          <input type="hidden" name="month" defaultValue={m} />
          <button type="submit" className="text-red-600 text-sm hover:underline">
            Excluir meta
          </button>
        </form>
      </div>
    </main>
  )
}
