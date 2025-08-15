// lib/metrics.ts
import { SupabaseClient } from '@supabase/supabase-js'

export type MonthlyMetrics = {
  income: number
  expense: number
  balance: number
  byCategory: { name: string; y: number }[]
  series: { categories: string[]; income: number[]; expense: number[] }
}

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(start), to: iso(end) }
}

export async function getMonthlyMetrics(supabase: SupabaseClient): Promise<MonthlyMetrics> {
  const { from, to } = monthRange()

  // Busca tudo do mês (o RLS já filtra por user_id automaticamente)
  const { data, error } = await supabase
    .from('transactions')
    .select('date, amount, type, category')
    .gte('date', from)
    .lte('date', to)

  if (error) throw error

  let income = 0
  let expense = 0

  // timeseries por dia do mês
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate()
  const dayKeys = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const dayLabel = (d: number) => d.toString().padStart(2, '0')
  const categories = dayKeys.map(d => dayLabel(d))
  const seriesIncome = Array.from({ length: daysInMonth }, () => 0)
  const seriesExpense = Array.from({ length: daysInMonth }, () => 0)

  // agregação por categoria (somente despesas)
  const catMap = new Map<string, number>()

  for (const t of data ?? []) {
    const amt = Number(t.amount)
    const d = new Date(t.date)
    const idx = d.getDate() - 1

    if (amt >= 0) {
      income += amt
      if (idx >= 0 && idx < seriesIncome.length) seriesIncome[idx] += amt
    } else {
      const abs = Math.abs(amt)
      expense += abs
      if (idx >= 0 && idx < seriesExpense.length) seriesExpense[idx] += abs
      const cat = t.category ?? 'Outros'
      catMap.set(cat, (catMap.get(cat) ?? 0) + abs)
    }
  }

  const byCategory = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, y]) => ({ name, y }))

  return {
    income,
    expense,
    balance: income - expense,
    byCategory,
    series: { categories, income: seriesIncome, expense: seriesExpense },
  }
}
