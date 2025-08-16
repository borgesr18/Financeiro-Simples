// app/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'

type CatObj = { name: string }
type AccObj = { name: string }

type TxRow = {
  id: string
  date: string
  description: string
  amount: number
  type: 'expense' | 'income'
  categories?: CatObj | CatObj[] | null
  accounts?: AccObj | AccObj[] | null
}

type BalanceRow = {
  account_id: string
  user_id: string
  name: string
  type: string
  archived: boolean
  balance: number
}

type BudgetRowRaw = {
  id: string
  category_id: string | null
  amount: number
  categories?: CatObj | CatObj[] | null
}

function getName<T extends { name: string }>(
  v: T | T[] | null | undefined,
  fallback = '—'
) {
  if (!v) return fallback
  if (Array.isArray(v)) return v[0]?.name ?? fallback
  return v.name ?? fallback
}

function getMonthBounds(date = new Date()) {
  const y = date.getFullYear()
  const m = date.getMonth() // 0-11
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { year: y, month: m + 1, startISO: toISO(start), endISO: toISO(end) }
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para ver o dashboard.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const { year, month, startISO, endISO } = getMonthBounds()

  // ---- Saldos por conta (view)
  const { data: balancesData } = await supabase
    .from('v_account_balances')
    .select('account_id, user_id, name, type, archived, balance')
    .eq('user_id', user.id)

  const balances = (balancesData ?? []) as BalanceRow[]
  const activeAccounts = balances.filter(b => !b.archived)
  const totalActive = activeAccounts.reduce((acc, r) => acc + (Number(r.balance) || 0), 0)
  const topAccounts = activeAccounts
    .slice()
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 5)

  // ---- Últimos lançamentos
  const { data: txData } = await supabase
    .from('transactions')
    .select('id, date, description, amount, type, categories:category_id(name), accounts:account_id(name)')
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(10)

  const lastTx = (txData ?? []) as TxRow[]

  // ---- Orçamento x Realizado do mês
  const { data: budgetsData } = await supabase
    .from('budgets')
    .select('id, category_id, amount, categories:category_id(name)')
    .eq('user_id', user.id)
    .eq('year', year)
    .eq('month', month)

  const budgets = (budgetsData ?? []) as BudgetRowRaw[]

  // gastos do mês (somar despesas como positivos)
  const { data: monthTxData } = await supabase
    .from('transactions')
    .select('id, date, amount, category_id, type')
    .eq('user_id', user.id)
    .gte('date', startISO)
    .lte('date', endISO)
    .limit(5000)

  const monthTx = (monthTxData ?? []) as { amount: number; category_id: string | null; type: 'expense'|'income' }[]

  // agregações
  const spentByCat = new Map<string, number>()
  for (const t of monthTx) {
    if (t.amount < 0) {
      const cid = t.category_id ?? '__none__'
      const prev = spentByCat.get(cid) ?? 0
      spentByCat.set(cid, prev + Math.abs(Number(t.amount) || 0))
    }
  }

  const plannedByCat = new Map<string, { amount: number; name: string }>()
  for (const b of budgets) {
    const cid = b.category_id ?? '__none__'
    const cat = Array.isArray(b.categories) ? b.categories[0] : b.categories
    const name = cat?.name ?? '—'
    const prev = plannedByCat.get(cid)?.amount ?? 0
    plannedByCat.set(cid, { amount: prev + (Number(b.amount) || 0), name })
  }

  const totalPlanned = Array.from(plannedByCat.values()).reduce((acc, r) => acc + r.amount, 0)
  const totalSpent = Array.from(spentByCat.values()).reduce((acc, v) => acc + v, 0)
  const diff = totalPlanned - totalSpent

  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    // ⬇️ Barra de rolagem garantida e folga no fim
    <main className="p-6 space-y-6 min-h-dvh min-h-screen overflow-y-auto pb-24">
      {/* Cabeçalho */}
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-neutral-500">Bem-vindo! Resumo de {monthLabel}.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/add" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">
            Novo lançamento
          </Link>
          <Link href="/transactions" className="px-4 py-2 border rounded-lg hover:bg-neutral-50">
            Ver lançamentos
          </Link>
        </div>
      </div>

      {/* Cards do mês */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Planejado (mês)</div>
          <div className="text-lg font-semibold">{formatBRL(totalPlanned)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Gasto (mês)</div>
          <div className="text-lg font-semibold text-rose-600">{formatBRL(totalSpent)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Diferença (mês)</div>
          <div className={`text-lg font-semibold ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatBRL(diff)}
          </div>
        </div>
      </section>

      {/* Saldos por conta */}
      <section className="bg-white rounded-xl shadow-card">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contas & Saldos</h2>
          <Link href="/banking" className="text-sm text-sky-600 hover:underline">Gerenciar contas</Link>
        </div>
        <div className="p-4">
          <div className="mb-2 text-sm text-neutral-500">Total (ativas): <strong>{formatBRL(totalActive)}</strong></div>
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left border-b">
                  <th className="py-2 px-3">Conta</th>
                  <th className="py-2 px-3">Tipo</th>
                  <th className="py-2 px-3">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {topAccounts.map((a) => {
                  const positive = (a.balance ?? 0) >= 0
                  return (
                    <tr key={a.account_id} className="border-b last:border-0">
                      <td className="py-2 px-3">{a.name}</td>
                      <td className="py-2 px-3">{a.type}</td>
                      <td className={`py-2 px-3 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatBRL(a.balance)}
                      </td>
                    </tr>
                  )
                })}
                {topAccounts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-neutral-500">Nenhuma conta ativa.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Últimos lançamentos */}
      <section className="bg-white rounded-xl shadow-card">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Últimos lançamentos</h2>
          <Link href="/transactions" className="text-sm text-sky-600 hover:underline">Ver todos</Link>
        </div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-3">Data</th>
                <th className="py-2 px-3">Descrição</th>
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3">Conta</th>
                <th className="py-2 px-3">Valor</th>
              </tr>
            </thead>
            <tbody>
              {lastTx.map((tx) => {
                const catName = getName(tx.categories)
                const accName = getName(tx.accounts)
                const positive = (tx.amount ?? 0) >= 0
                return (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="py-2 px-3">{new Date(tx.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-2 px-3">{tx.description}</td>
                    <td className="py-2 px-3">{catName}</td>
                    <td className="py-2 px-3">{accName}</td>
                    <td className={`py-2 px-3 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatBRL(tx.amount)}
                    </td>
                  </tr>
                )
              })}
              {lastTx.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">Sem lançamentos ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
