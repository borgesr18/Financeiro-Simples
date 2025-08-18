// app/budget/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { createBudget, deleteBudget } from './actions'

type Category = {
  id: string
  name: string
}

type BudgetRow = {
  id: string
  year: number
  month: number
  amount: number
  category_id: string
  category_name: string | null
}

function monthLabel(y: number, m: number) {
  // m = 1..12
  const d = new Date(y, m - 1, 1)
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

export default async function BudgetPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar orçamentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  // Carrega categorias (para o formulário "Novo orçamento")
  const { data: catData, error: catErr } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (catErr) {
    console.error('[budget/page] categories error:', catErr)
  }
  const categories: Category[] = (catData ?? []).map(c => ({
    id: String(c.id),
    name: (c as any).name ?? 'Sem nome',
  }))

  // Carrega orçamentos + nome da categoria
  const { data: bData, error: bErr } = await supabase
    .from('budgets')
    .select('id, year, month, amount, category_id, categories(name)')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('category_id', { ascending: true })

  if (bErr) {
    console.error('[budget/page] budgets error:', bErr)
  }

  // Normaliza o nested categories(name) (objeto OU array)
  const rows: BudgetRow[] = (bData ?? []).map((b: any) => {
    const cat = b.categories
    const catName = Array.isArray(cat)
      ? (cat[0]?.name ?? null)
      : (cat?.name ?? null)
    return {
      id: String(b.id),
      year: Number(b.year) || new Date().getFullYear(),
      month: Number(b.month) || (new Date().getMonth() + 1),
      amount: Number(b.amount) || 0,
      category_id: String(b.category_id),
      category_name: catName,
    }
  })

  const total = rows.reduce((acc, r) => acc + (r.amount || 0), 0)

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orçamentos</h1>
          <p className="text-sm text-neutral-500">
            {rows.length} item(ns) • Total planejado: {formatBRL(total)}
          </p>
        </div>
        <Link href="/settings/categories" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">
          Gerenciar categorias
        </Link>
      </div>

      {/* Novo orçamento */}
      <section className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold mb-4">Novo orçamento</h2>
        <form action={createBudget} className="grid gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Categoria</label>
            <select name="category_id" className="w-full rounded-lg border px-3 py-2">
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">Ano</label>
            <input
              name="year"
              type="number"
              className="w-full rounded-lg border px-3 py-2"
              defaultValue={new Date().getFullYear()}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Mês (1–12)</label>
            <input
              name="month"
              type="number"
              min={1}
              max={12}
              className="w-full rounded-lg border px-3 py-2"
              defaultValue={new Date().getMonth() + 1}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm mb-1">Valor</label>
            <input
              name="amount"
              type="number"
              step="0.01"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="0,00"
            />
          </div>
          <div className="sm:col-span-2 flex items-end">
            <button className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg">
              Adicionar
            </button>
          </div>
        </form>
      </section>

      {/* Tabela */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr className="text-left">
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-3 px-4">{monthLabel(r.year, r.month)}</td>
                  <td className="py-3 px-4">{r.category_name ?? '—'}</td>
                  <td className="py-3 px-4">{formatBRL(r.amount)}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      {/* Mantendo a regra do módulo: exclusão direta (sem lixeira) */}
                      <form action={deleteBudget}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-500">
                    Nenhum orçamento cadastrado.
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
