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

// Relacionamento categories pode vir como objeto ou como array
type RelCat =
  | { id: string; name: string }
  | { id: string; name: string }[]
  | null
  | undefined

type BudgetRow = {
  id: string
  amount: number            // <- usa a coluna real do seu schema
  category_id?: string | null
  categories?: RelCat
}

function pickCat(rel: RelCat): { id?: string; name?: string } {
  if (!rel) return {}
  return Array.isArray(rel) ? (rel[0] ?? {}) : rel
}

export async function getBudgets(year: number, month: number): Promise<BudgetLine[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const start = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 0) // último dia do mês
  const end = endDate.toISOString().slice(0, 10)

  try {
    // Orçamentos do mês
    const { data: budgetsRaw, error: bErr } = await supabase
      .from('budgets')
      .select('id, amount, category_id, categories:category_id(id, name)')
      .eq('year', year)
      .eq('month', month)
      .eq('user_id', user.id)

    if (bErr) {
      console.error('[lib/budgets] Erro budgets:', bErr)
      throw new Error(bErr.message)
    }
    const budgets = (budgetsRaw ?? []) as BudgetRow[]

    // Transações do mês
    const { data: txs, error: tErr } = await supabase
      .from('transactions')
      .select('category_id, amount, type')
      .gte('date', start)
      .lte('date', end)
      .eq('user_id', user.id)

    if (tErr) {
      console.error('[lib/budgets] Erro transactions:', tErr)
      throw new Error(tErr.message)
    }

    const spentByCat = new Map<string, number>()
    for (const t of txs ?? []) {
      if (t?.type === 'expense' && typeof t.amount === 'number' && t.category_id) {
        spentByCat.set(
          t.category_id,
          (spentByCat.get(t.category_id) ?? 0) + Math.abs(Number(t.amount))
        )
      }
    }

    const lines: BudgetLine[] = []

    // Linhas com orçamento
    for (const b of budgets) {
      const cat = pickCat(b.categories)
      const catId = (b.category_id ?? cat.id ?? '') as string
      const spent = spentByCat.get(catId) ?? 0
      const planned = Number(b.amount) || 0

      lines.push({
        id: b.id,
        category: cat.name ?? '—',
        amount: planned,
        spent,
        percent: planned > 0 ? (spent / planned) * 100 : 0,
        over: planned > 0 && spent > planned,
        hasBudget: true,
      })
    }

    // Categorias que gastaram mas não têm orçamento
    for (const [catId, spent] of spentByCat) {
      const already = budgets.some((b) => {
        const cat = pickCat(b.categories)
        return (b.category_id ?? cat.id) === catId
      })
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
  } catch (e) {
    console.error('[lib/budgets] Falha geral:', e)
    throw e
  }
}

// Compat com páginas que importam o nome antigo
export { getBudgets as getBudgetsWithSpend }

