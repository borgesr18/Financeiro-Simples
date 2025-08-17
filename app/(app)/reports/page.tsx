// app/(app)/reports/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatBRL } from '@/lib/format'

type Tx = {
  id: string
  date: string // YYYY-MM-DD
  amount: number
  type: 'income' | 'expense' | string
  category_id: string | null
  account_id: string
  deleted_at?: string | null
}

type Category = { id: string; name: string }
type Account = { id: string; name: string; type: string; archived: boolean }

function pad2(n: number) {
  return String(n).padStart(2, '0')
}
function ymdLocal(d: Date) {
  const y = d.getFullYear()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${y}-${pad2(m)}-${pad2(day)}`
}
function firstDayOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function firstDayOfNextMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1)
}
function firstDayMonthsAgo(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() - months, 1)
}
function monthKey(d: Date | string) {
  const dt = typeof d === 'string' ? new Date(d + 'T00:00:00') : d
  return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}`
}
function monthLabel(key: string) {
  const [y, m] = key.split('-').map(Number)
  const labels = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${labels[(m - 1 + 12) % 12]}/${String(y).slice(-2)}`
}

export default async function ReportsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Relatórios</h1>
          <p className="mb-4">Faça login para visualizar seus relatórios.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  // Período "mês atual"
  const now = new Date()
  const dtStart = firstDayOfMonth(now)
  const dtEnd = firstDayOfNextMonth(now)
  const ano = now.getFullYear()
  const mesNum = now.getMonth() + 1 // 1..12

  // Período "últimos 12 meses" (para saldos por conta por mês)
  const dt12Start = firstDayMonthsAgo(now, 11)

  // --- Bases auxiliares (nomes) ---
  const [{ data: categoriesData }, { data: accountsData }] = await Promise.all([
    supabase.from('categories')
      .select('id,name')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('name', { ascending: true }),
    supabase.from('accounts')
      .select('id,name,type,archived')
      .eq('user_id', user.id)
  ])

  const categories = (categoriesData ?? []) as Category[]
  const accounts = (accountsData ?? []) as Account[]

  const catName = new Map<string, string>()
  for (const c of categories) catName.set(c.id, c.name)

  const accName = new Map<string, string>()
  const accType = new Map<string, string>()
  for (const a of accounts) {
    accName.set(a.id, a.name)
    accType.set(a.id, a.type)
  }

  // --- Dados de transações do mês atual (usamos para vários blocos) ---
  const { data: monthTxData, error: monthTxErr } = await supabase
    .from('transactions')
    .select('id,date,amount,type,category_id,account_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('date', ymdLocal(dtStart))
    .lt('date', ymdLocal(dtEnd))
    .limit(10000)

  if (monthTxErr) {
    throw new Error('Falha ao carregar transações do mês')
  }
  const monthTx = (monthTxData ?? []) as Tx[]

  // --- Dados de transações dos últimos 12 meses (para saldos por conta por mês) ---
  const { data: tx12Data, error: tx12Err } = await supabase
    .from('transactions')
    .select('id,date,amount,account_id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('date', ymdLocal(dt12Start))
    .limit(20000)

  if (tx12Err) {
    throw new Error('Falha ao carregar transações de 12 meses')
  }
  const tx12 = (tx12Data ?? []) as Tx[]

  // --- Orçamentos do mês (para BvA) ---
  const { data: budgetsData, error: budgetsErr } = await supabase
    .from('budgets')
    .select('id,category_id,amount')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .eq('year', ano)
    .eq('month', mesNum)

  if (budgetsErr) {
    throw new Error('Falha ao carregar orçamentos do mês')
  }
  const budgets = (budgetsData ?? []) as { id: string; category_id: string; amount: number }[]

  // ---------------------------
  // 1) Resumo do mês
  // ---------------------------
  let receitas = 0
  let despesas = 0
  for (const t of monthTx) {
    if (t.amount > 0) receitas += t.amount
    else if (t.amount < 0) despesas += -t.amount
  }
  const saldoMes = receitas - despesas

  // ---------------------------
  // 2) Despesas por categoria (período = mês atual)
  // ---------------------------
  const byCat = new Map<string, number>() // key = category_id || 'none'
  for (const t of monthTx) {
    if (t.amount < 0) {
      const key = t.category_id ?? 'none'
      byCat.set(key, (byCat.get(key) ?? 0) + (-t.amount))
    }
  }
  const despesasPorCategoria = Array.from(byCat.entries())
    .map(([cid, total]) => ({
      category_id: cid === 'none' ? null : cid,
      category_name: cid === 'none' ? 'Sem categoria' : (catName.get(cid) ?? 'Categoria'),
      total
    }))
    .sort((a, b) => b.total - a.total)

  // ---------------------------
  // 3) Orçamento vs Realizado (mês atual)
  // ---------------------------
  const spentByCat = new Map<string, number>() // gastos do mês (positivado)
  for (const t of monthTx) {
    if (t.amount < 0 && t.category_id) {
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + (-t.amount))
    }
  }
  const bvaRows = budgets.map(b => {
    const actual = spentByCat.get(b.category_id) ?? 0
    return {
      category_id: b.category_id,
      category_name: catName.get(b.category_id) ?? 'Categoria',
      budget: b.amount,
      actual,
      diff: b.amount - actual,
    }
  }).sort((a, b) => a.category_name.localeCompare(b.category_name))

  // ---------------------------
  // 4) Saldos por conta por mês (na prática: movimento líquido por mês)
  //    Últimos 12 meses
  // ---------------------------
  const MONTHS: string[] = []
  for (let i = 11; i >= 0; i--) {
    const d = firstDayMonthsAgo(now, i)
    MONTHS.push(monthKey(d))
  }

  type MonthlyRow = { month: string; account_id: string; account_name: string; net: number }
  const nets = new Map<string, number>() // key = `${monthKey}-${account_id}`
  for (const t of tx12) {
    const key = `${monthKey(t.date)}::${t.account_id}`
    nets.set(key, (nets.get(key) ?? 0) + (t.amount || 0))
  }
  const saldosPorContaPorMes: MonthlyRow[] = []
  for (const m of MONTHS) {
    for (const a of accounts) {
      const k = `${m}::${a.id}`
      const net = nets.get(k) ?? 0
      // Opcional: pular linhas completamente zeradas para reduzir ruído
      if (net === 0) continue
      saldosPorContaPorMes.push({
        month: m,
        account_id: a.id,
        account_name: a.name,
        net,
      })
    }
  }

  // ---------------------------
  // 5) Gastos com Cartões (mês atual)
  // ---------------------------
  const creditIds = new Set(accounts.filter(a => a.type === 'credit').map(a => a.id))
  const gastosPorCartao = new Map<string, number>() // account_id -> total gasto (positivo)
  for (const t of monthTx) {
    if (t.amount < 0 && creditIds.has(t.account_id)) {
      gastosPorCartao.set(t.account_id, (gastosPorCartao.get(t.account_id) ?? 0) + (-t.amount))
    }
  }
  const gastosCartoesRows = Array.from(gastosPorCartao.entries())
    .map(([account_id, total]) => ({
      account_id,
      account_name: accName.get(account_id) ?? 'Cartão',
      total
    }))
    .sort((a, b) => b.total - a.total)

  // Labels
  const monthLabelLong = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(now)

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Relatórios</h1>
          <p className="text-sm text-neutral-500">Período: {monthLabelLong}</p>
        </div>
      </div>

      {/* 1) Resumo do mês */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b bg-neutral-50">
          <h2 className="text-lg font-semibold">Resumo do mês</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4">
          <div className="rounded-lg border p-4">
            <div className="text-sm text-neutral-500">Receitas</div>
            <div className="text-xl font-semibold text-emerald-600">{formatBRL(receitas)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-neutral-500">Despesas</div>
            <div className="text-xl font-semibold text-rose-600">{formatBRL(despesas)}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="text-sm text-neutral-500">Saldo</div>
            <div className={`text-xl font-semibold ${saldoMes >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {formatBRL(saldoMes)}
            </div>
          </div>
        </div>
      </section>

      {/* 2) Despesas por categoria (mês) */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b bg-neutral-50">
          <h2 className="text-lg font-semibold">Despesas por categoria — {monthLabelLong}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {despesasPorCategoria.map(row => (
                <tr key={row.category_id ?? 'none'} className="border-b last:border-0">
                  <td className="py-3 px-4">{row.category_name}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(row.total)}</td>
                </tr>
              ))}
              {despesasPorCategoria.length === 0 && (
                <tr><td colSpan={2} className="py-6 text-center text-neutral-500">Sem despesas neste mês.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3) Orçamento vs Realizado (mês) */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b bg-neutral-50">
          <h2 className="text-lg font-semibold">Orçamento vs Realizado — {monthLabelLong}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-right">Orçado</th>
                <th className="py-3 px-4 text-right">Realizado</th>
                <th className="py-3 px-4 text-right">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {bvaRows.map(row => {
                const ok = row.diff >= 0
                return (
                  <tr key={row.category_id} className="border-b last:border-0">
                    <td className="py-3 px-4">{row.category_name}</td>
                    <td className="py-3 px-4 text-right">{formatBRL(row.budget)}</td>
                    <td className="py-3 px-4 text-right">{formatBRL(row.actual)}</td>
                    <td className={`py-3 px-4 text-right ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>{formatBRL(row.diff)}</td>
                  </tr>
                )
              })}
              {bvaRows.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-neutral-500">Nenhum orçamento para este mês.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4) Saldos por conta por mês (net) */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b bg-neutral-50">
          <h2 className="text-lg font-semibold">Movimento líquido por conta — últimos 12 meses</h2>
          <p className="text-xs text-neutral-500 mt-1">
            *Valor líquido do mês por conta (entradas − saídas). Se quiser que eu mostre saldo acumulado, dá pra calcular também.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[820px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4 text-right">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {saldosPorContaPorMes.map((row, idx) => {
                const pos = row.net >= 0
                return (
                  <tr key={idx} className="border-b last:border-0">
                    <td className="py-3 px-4">{monthLabel(row.month)}</td>
                    <td className="py-3 px-4">{row.account_name}</td>
                    <td className={`py-3 px-4 text-right ${pos ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {formatBRL(row.net)}
                    </td>
                  </tr>
                )
              })}
              {saldosPorContaPorMes.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-neutral-500">Sem movimentos nos últimos 12 meses.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5) Gastos com Cartões (mês) */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b bg-neutral-50">
          <h2 className="text-lg font-semibold">Gastos com Cartões — {monthLabelLong}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Cartão</th>
                <th className="py-3 px-4 text-right">Total gasto</th>
              </tr>
            </thead>
            <tbody>
              {gastosCartoesRows.map(row => (
                <tr key={row.account_id} className="border-b last:border-0">
                  <td className="py-3 px-4">{row.account_name}</td>
                  <td className="py-3 px-4 text-right">{formatBRL(row.total)}</td>
                </tr>
              ))}
              {gastosCartoesRows.length === 0 && (
                <tr><td colSpan={2} className="py-6 text-center text-neutral-500">Nenhum gasto com cartões neste mês.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}

