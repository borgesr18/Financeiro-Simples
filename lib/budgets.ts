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

type BudgetRowYM = {
  id: string
  amount: number
  category_id?: string | null
  year?: number
  month?: number
  categories?: RelCat
}

type BudgetRowPeriod = {
  id: string
  amount: number
  category_id?: string | null
  period?: string
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

  const y = Number(year)
  const m = Number(month)
  const start = `${y}-${String(m).padStart(2, '0')}-01`
  const endDate = new Date(y, m, 0) // último dia do mês
  const end = endDate.toISOString().slice(0, 10)
  const period = `${y}-${String(m).padStart(2, '0')}`

  try {
    // ========= Orçamentos (tenta YEAR/MONTH, cai para PERIOD) =========
    let budgetsYM: BudgetRowYM[] | null = null
    let budgetsPeriod: BudgetRowPeriod[] | null = null

    // Tentativa 1: year/month
    {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, amount, category_id, year, month, categories:category_id(id, name)')
        .eq('user_id', user.id)
        .eq('year', y)
        .eq('month', m)

      if (error) {
        // Se for coluna inexistente (42703), tentamos PERIOD
        if (error.code === '42703' || /column .* does not exist/i.test(error.message ?? '')) {
          budgetsYM = null
        } else {
          console.error('[lib/budgets] Erro budgets (year/month):', error)
          throw new Error(error.message)
        }
      } else {
        budgetsYM = (data ?? []) as BudgetRowYM[]
      }
    }

    // Tentativa 2: period (se YM falhou por coluna inexistente)
    if (!budgetsYM) {
      const { data, error } = await supabase
        .from('budgets')
        .select('id, amount, category_id, period, categories:category_id(id, name)')
        .eq('user_id', user.id)
        .eq('period', period)

      if (error) {
        console.error('[lib/budgets] Erro budgets (period):', error)
        throw new Error(error.message)
      }
      budgetsPeriod = (data ?? []) as BudgetRowPeriod[]
    }

    // ========= Transações do mês =========
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
    const budgetedCatIds = new Set<string>() // para saber quem já tem orçamento

    // ========= Montagem das linhas =========
    if (budgetsYM) {
      for (const b of budgetsYM) {
        const cat = pickCat(b.categories)
        const catId = (b.category_id ?? cat.id ?? '') as string
        const spent = spentByCat.get(catId) ?? 0
        const planned = Number(b.amount) || 0

        if (catId) budgetedCatIds.add(catId)

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
    } else if (budgetsPeriod) {
      for (const b of budgetsPeriod) {
        const cat = pickCat(b.categories)
        const catId = (b.category_id ?? cat.id ?? '') as string
        const spent = spentByCat.get(catId) ?? 0
        const planned = Number(b.amount) || 0

        if (catId) budgetedCatIds.add(catId)

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
    }

    // Categorias com gasto mas sem orçamento
    for (const [catId, spent] of spentByCat) {
      if (!budgetedCatIds.has(catId)) {
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
  } catch (err) {
    console.error('[lib/budgets] Falha geral:', err)
    throw err
  }
}

// Compat com páginas que importam o nome antigo
export { getBudgets as getBudgetsWithSpend }

