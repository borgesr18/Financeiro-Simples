// lib/budgets.ts
import { createClient } from '@/lib/supabase/server'

export type BudgetLine = {
  id: string
  category: string
  amount: number
  spent: number
  percent: number
  over: boolean
  hasBudget: boolean
}

export async function getBudgets(year: number, month: number): Promise<BudgetLine[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0) // último dia do mês
  const end = endDate.toISOString().slice(0, 10)

  // buscar orçamentos do mês
  const { data: budgets } = await supabase
    .from('budgets')
    .select('id, planned_amount, category_id, categories:category_id(name)')
    .eq('year', year)
    .eq('month', month)
    .eq('user_id', user.id)

  // buscar transações do mês
  const { data: txs } = await supabase
    .from('transactions')
    .select('category_id, amount, type')
    .gte('date', start)
    .lte('date', end)
    .eq('user_id', user.id)

  const spentByCat = new Map<string, number>()
  for (const t of txs ?? []) {
    if (t?.type === 'expense' && typeof t.amount === 'number' && t.category_id) {
      spentByCat.set(
        t.category_id,
        (spentByCat.get(t.category_id) ?? 0) + Math.abs(t.amount)
      )
    }
  }

  const lines: BudgetLine[] = []

  for (const b of budgets ?? []) {
    const spent = spentByCat.get(b.category_id ?? '') ?? 0
    const amount = Number(b.planned_amount) || 0
    lines.push({
      id: b.id,
      category: b.categories?.name ?? '—',
      amount,
      spent,
      percent: amount > 0 ? (spent / amount) * 100 : 0,
      over: amount > 0 && spent > amount,
      hasBudget: true,
    })
  }

  // categorias que tiveram gasto mas não têm orçamento
  for (const [catId, spent] of spentByCat) {
    const already = (budgets ?? []).some(b => b.category_id === catId)
    if (!already) {
      lines.push({
        id: `tx-${catId}`,
        category: 'Sem orçamento',
        amount: 0,
        spent,
        percent: 0,
        over: true,
        hasBudget: false,
      })
    }
  }

  return lines
}

// Compatibilidade com páginas que importam o nome antigo
export { getBudgets as getBudgetsWithSpend };

