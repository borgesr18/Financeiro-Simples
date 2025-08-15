// lib/budgets.ts
import { SupabaseClient } from '@supabase/supabase-js'

export type BudgetLine = {
  category: string
  amount: number       // meta
  spent: number        // gasto (apenas saídas) no mês
  percent: number      // spent / amount * 100 (ou 0 se amount=0)
  over: boolean        // estourou?
}

function monthRange(y: number, m: number) {
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(start), to: iso(end) }
}

export async function getBudgetsWithSpend(
  supabase: SupabaseClient,
  y: number,
  m: number
): Promise<BudgetLine[]> {
  const { from, to } = monthRange(y, m)

  // 1) metas do mês
  const { data: budgets, error: bErr } = await supabase
    .from('budgets')
    .select('category, amount')
    .eq('year', y)
    .eq('month', m)
    .order('category', { ascending: true })

  if (bErr) throw bErr

  // 2) gastos do mês (apenas despesas)
  const { data: tx, error: tErr } = await supabase
    .from('transactions')
    .select('category, amount')
    .gte('date', from)
    .lte('date', to)
    .lt('amount', 0) // somente saídas

  if (tErr) throw tErr

  // soma por categoria (saídas em valor absoluto)
  const spentMap = new Map<string, number>()
  for (const t of tx ?? []) {
    const cat = t.category ?? 'Outros'
    const v = Math.abs(Number(t.amount ?? 0))
    spentMap.set(cat, (spentMap.get(cat) ?? 0) + v)
  }

  // merge com metas (se houver gasto sem meta, podemos exibir também — opcional)
  const lines: BudgetLine[] = []

  // categorias com meta
  for (const b of budgets ?? []) {
    const cat = b.category
    const limit = Number(b.amount ?? 0)
    const spent = Number(spentMap.get(cat) ?? 0)
    const percent = limit > 0 ? (spent / limit) * 100 : (spent > 0 ? 999 : 0)
    lines.push({
      category: cat,
      amount: limit,
      spent,
      percent,
      over: spent > limit && limit > 0
    })
    spentMap.delete(cat)
  }

  // (opcional) categorias com gasto e sem meta — mostramos para chamar atenção
  for (const [cat, spent] of spentMap.entries()) {
    lines.push({
      category: cat,
      amount: 0,
      spent: Number(spent),
      percent: spent > 0 ? 999 : 0,
      over: false,
    })
  }

  // ordena: estourados primeiro, depois por maior % usado
  return lines.sort((a, b) => {
    if (a.over !== b.over) return a.over ? -1 : 1
    return b.percent - a.percent
  })
}
