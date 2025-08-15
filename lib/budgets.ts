// lib/budgets.ts
import type { SupabaseClient } from '@supabase/supabase-js'

export type BudgetWithSpend = {
  id?: string
  category: string
  amount: number
  spent: number
  percent: number
  over: boolean
  hasBudget: boolean
}

export async function getBudgetsWithSpend(
  supabase: SupabaseClient,
  year: number,
  month: number
): Promise<BudgetWithSpend[]> {
  try {
    // 1) busca budgets do mês
    const { data: budgets, error: e1 } = await supabase
      .from('budgets')
      .select('id, category, amount')
      .eq('year', year)
      .eq('month', month)

    if (e1) {
      console.error('getBudgetsWithSpend: budgets error', e1)
      return []
    }

    // 2) soma gastos por categoria no mês (só expenses)
    const start = new Date(year, month - 1, 1).toISOString()
    const end = new Date(year, month, 0, 23, 59, 59, 999).toISOString()

    const { data: sums, error: e2 } = await supabase
      .from('transactions')
      .select('category, amount, type')
      .gte('date', start)
      .lte('date', end)

    if (e2) {
      console.error('getBudgetsWithSpend: sums error', e2)
      // Mesmo com erro, ainda devolvemos as metas com spent=0
    }

    const spentByCat = new Map<string, number>()
    for (const t of sums ?? []) {
      if (t?.type === 'expense' && typeof t.amount === 'number') {
        const key = String(t.category ?? 'Outros')
        spentByCat.set(key, (spentByCat.get(key) ?? 0) + Math.abs(t.amount))
      }
    }

    const lines: BudgetWithSpend[] = []
    // metas existentes
    for (const b of budgets ?? []) {
      const spent = spentByCat.get(b.category) ?? 0
      const amount = Number(b.amount) || 0
      const percent = amount > 0 ? (spent / amount) * 100 : 0
      lines.push({
        id: b.id,
        category: b.category,
        amount,
        spent,
        percent,
        over: amount > 0 && spent > amount,
        hasBudget: true,
      })
      // remove da soma para sobrar só categorias sem meta
      spentByCat.delete(b.category)
    }

    // categorias gastas sem meta
    for (const [category, spent] of spentByCat.entries()) {
      lines.push({
        category,
        amount: 0,
        spent,
        percent: 0,
        over: false,
        hasBudget: false,
      })
    }

    return lines
  } catch (err) {
    console.error('getBudgetsWithSpend: unexpected error', err)
    return []
  }
}
