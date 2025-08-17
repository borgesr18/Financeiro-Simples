// app/(app)/analytics/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import Link from 'next/link'

// ------------------------------
// Helpers de data
// ------------------------------
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}
function ymKey(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}
function labelMMMYY(d: Date) {
  return d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')
}
function daysInMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

// Escala simples para cores do heatmap (0 → claro, alto → +escuro)
function heatColor(v: number, max: number) {
  if (max <= 0) return '#eef2ff'
  const t = Math.min(1, v / max)
  // tons de azul (H 221) variando luminosidade
  const light = 95 - Math.round(t * 55) // 95% → 40%
  return `hsl(221 83% ${light}%)`
}

// Linha em SVG a partir de pontos normalizados
function pathFromPoints(points: { x: number; y: number }[]) {
  if (!points.length) return ''
  return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ')
}

type TxRow = {
  id: string
  date: string
  amount: number
  type: 'income' | 'expense'
  category_id: string | null
  account_id: string | null
  categories: { name: string } | null
  accounts: { type: string } | null
}

export default async function AnalyticsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para ver análises.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  // Períodos de interesse
  const today = new Date()
  const from12 = startOfMonth(addMonths(today, -11)) // últimos 12 meses (inclui o atual)
  const from90d = new Date(today); from90d.setDate(from90d.getDate() - 83) // ~12 semanas (84 dias)
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)

  // Pré-carrega Transações necessárias em um tiro só (até 5000 registros)
  const { data: txAll, error: errAll } = await supabase
    .from('transactions')
    .select(`
      id, date, amount, type, category_id, account_id,
      categories ( name ),
      accounts ( type )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .gte('date', from12.toISOString())
    .lte('date', monthEnd.toISOString())
    .limit(5000)

  // Se algo falhar, não quebra a página — mostra info parcial
  const tx: TxRow[] = (txAll ?? []) as any

  // ------------------------------
  // 1) Receitas vs Despesas (12 meses) + média móvel de 3 meses do saldo
  // ------------------------------
  const months: Date[] = Array.from({ length: 12 }, (_, i) => addMonths(from12, i))
  const byMonth = months.map(d => ({ key: ymKey(d), label: labelMMMYY(d), income: 0, expense: 0 }))

  for (const t of tx) {
    const d = new Date(t.date)
    const key = ymKey(d)
    const bucket = byMonth.find(b => b.key === key)
    if (!bucket) continue
    if (t.type === 'income' || t.amount > 0) bucket.income += Math.abs(t.amount)
    else bucket.expense += Math.abs(t.amount)
  }
  const net = byMonth.map(b => b.income - b.expense)
  const ma3 = net.map((_, i) => {
    const slice = net.slice(Math.max(0, i - 2), i + 1)
    return slice.reduce((a, v) => a + v, 0) / slice.length
  })

  // Normaliza para 240x80 de área de gráfico
  const W = 720, H = 220, P = 28
  const maxY = Math.max(1, ...byMonth.map(b => Math.max(b.income, b.expense)))
  const xStep = (W - P * 2) / Math.max(1, byMonth.length - 1)
  const toY = (v: number) => P + (H - P * 2) * (1 - v / maxY)
  const toX = (i: number) => P + i * xStep

  const incomePts = byMonth.map((b, i) => ({ x: toX(i), y: toY(b.income) }))
  const expensePts = byMonth.map((b, i) => ({ x: toX(i), y: toY(b.expense) }))
  const maPts = ma3.map((v, i) => ({ x: toX(i), y: toY(Math.max(0, v)) }))

  // ------------------------------
  // 2) Heatmap (últimas ~12 semanas) - despesas por dia
  // ------------------------------
  const daily: Record<string, number> = {} // yyyy-mm-dd -> total despesas
  const day0 = new Date(from90d)
  while (day0 <= today) {
    const k = day0.toISOString().slice(0, 10)
    daily[k] = 0
    day0.setDate(day0.getDate() + 1)
  }
  for (const t of tx) {
    const d = new Date(t.date)
    if (d < from90d || d > today) continue
    if ((t.type === 'expense') || t.amount < 0) {
      const k = d.toISOString().slice(0, 10)
      daily[k] = (daily[k] || 0) + Math.abs(t.amount)
    }
  }
  const dailyKeys = Object.keys(daily).sort()
  const maxDaily = dailyKeys.reduce((m, k) => Math.max(m, daily[k]), 0)

  // Organiza por semanas (colunas) e dias (linhas 0-dom..6-sáb? Em pt-BR domingo=0)
  function dow(d: Date) { return d.getDay() } // 0..6
  const weeks: { date: string; value: number }[][] = []
  let col: { date: string; value: number }[] = Array(7).fill(null).map((_) => ({ date: '', value: 0 }))
  let currentWeekStartDow = dow(new Date(dailyKeys[0] ?? today))
  // Preenche coluna inicial com vazios até começar
  col = Array(currentWeekStartDow).fill(0).map(() => ({ date: '', value: 0 })).concat(col.slice(currentWeekStartDow))

  for (const k of dailyKeys) {
    const d = new Date(k)
    const i = dow(d)
    if (i === 0 && col.some(c => c.date !== '' || c.value !== 0)) {
      weeks.push(col)
      col = Array(7).fill(null).map((_) => ({ date: '', value: 0 }))
    }
    col[i] = { date: k, value: daily[k] }
  }
  if (col.some(c => c.date !== '' || c.value !== 0)) weeks.push(col)

  // ------------------------------
  // 3) Top 5 categorias por variação (mês atual vs média 6 meses anteriores) - só despesas
  // ------------------------------
  const sixMonthsAgo = startOfMonth(addMonths(today, -6))
  type CatAgg = { name: string; current: number; avg6: number; diff: number }
  const catAgg: Record<string, { current: number; pastSum: number; pastCount: number }> = {}

  for (const t of tx) {
    const isExpense = (t.type === 'expense') || t.amount < 0
    if (!isExpense) continue
    const name = t.categories?.name ?? 'Sem categoria'
    const d = new Date(t.date)
    if (d >= monthStart && d <= monthEnd) {
      catAgg[name] = catAgg[name] || { current: 0, pastSum: 0, pastCount: 0 }
      catAgg[name].current += Math.abs(t.amount)
    } else if (d >= sixMonthsAgo && d < monthStart) {
      catAgg[name] = catAgg[name] || { current: 0, pastSum: 0, pastCount: 0 }
      catAgg[name].pastSum += Math.abs(t.amount)
      // contamos mês distinto? Para simplificar, média por 6 meses fixos:
      // dividimos por 6 no final (meses completos).
    }
  }
  const catRows: CatAgg[] = Object.entries(catAgg).map(([name, v]) => {
    const avg6 = v.pastSum / 6
    return { name, current: v.current, avg6, diff: v.current - avg6 }
  }).sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff)).slice(0, 5)

  // ------------------------------
  // 4) Projeção de fatura de cartões (mês atual)
  // ------------------------------
  // Pega contas do tipo 'credit'
  const { data: creditAcc, error: errAcc } = await supabase
    .from('accounts')
    .select('id')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .eq('type', 'credit')

  const creditIds = (creditAcc ?? []).map(a => a.id)
  let cardMonthSpend = 0
  if (creditIds.length) {
    for (const t of tx) {
      const d = new Date(t.date)
      if (d < monthStart || d > monthEnd) continue
      if (!t.account_id || !creditIds.includes(t.account_id)) continue
      const isExpense = (t.type === 'expense') || t.amount < 0
      if (isExpense) cardMonthSpend += Math.abs(t.amount)
    }
  }
  const day = today.getDate()
  const dim = daysInMonth(today)
  const proj = day > 0 ? (cardMonthSpend / day) * dim : cardMonthSpend
  const projCap = Math.max(cardMonthSpend, proj)
  const progressPct = Math.min(100, Math.round((cardMonthSpend / Math.max(1, projCap)) * 100))

  // Totais de cabeçalho
  const totalIncome = byMonth.at(-1)?.income ?? 0
  const totalExpense = byMonth.at(-1)?.expense ?? 0
  const totalNet = totalIncome - totalExpense

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Análises</h1>
        <p className="text-sm text-neutral-500">Visões exploratórias (mês atual e históricos).</p>
      </div>

      {/* KPIs simples */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Receitas (mês)</div>
          <div className="text-xl font-semibold">{formatBRL(totalIncome)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Despesas (mês)</div>
          <div className="text-xl font-semibold">{formatBRL(totalExpense)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4">
          <div className="text-xs text-neutral-500">Saldo (mês)</div>
          <div className={`text-xl font-semibold ${totalNet >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatBRL(totalNet)}
          </div>
        </div>
      </div>

      {/* 1) Receitas vs Despesas (12 meses) */}
      <section className="bg-white rounded-xl shadow-card p-4">
        <h2 className="text-lg font-semibold mb-3">Receitas vs Despesas — últimos 12 meses</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <svg width={W} height={H} className="w-full h-auto">
              {/* Grade horizontal */}
              {[0.25, 0.5, 0.75, 1].map((g, i) => {
                const y = P + (H - P * 2) * (1 - g)
                return <line key={i} x1={P} y1={y} x2={W - P} y2={y} stroke="#eee" />
              })}
              {/* Eixos (simples) */}
              <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="#ddd" />
              <line x1={P} y1={P} x2={P} y2={H - P} stroke="#ddd" />
              {/* Income (azul) */}
              <path d={pathFromPoints(incomePts)} stroke="#2563eb" fill="none" strokeWidth={2} />
              {/* Expense (vermelho) */}
              <path d={pathFromPoints(expensePts)} stroke="#dc2626" fill="none" strokeWidth={2} />
              {/* MA3 do saldo (preto) */}
              <path d={pathFromPoints(maPts)} stroke="#111827" fill="none" strokeDasharray="4 4" strokeWidth={1.5} />

              {/* Labels de mês */}
              {byMonth.map((b, i) => (
                <text
                  key={b.key}
                  x={toX(i)}
                  y={H - P + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {b.label}
                </text>
              ))}
            </svg>
            <div className="flex gap-4 text-xs text-neutral-600 mt-2">
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-blue-600" /> Receitas</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-rose-600" /> Despesas</div>
              <div className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-neutral-800" style={{ borderBottom: '1px dashed #111' }} /> MA3 do saldo</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2) Heatmap despesas por dia (últimas ~12 semanas) */}
      <section className="bg-white rounded-xl shadow-card p-4">
        <h2 className="text-lg font-semibold mb-3">Gastos por dia (últimas 12 semanas)</h2>
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="flex gap-1">
              {weeks.map((w, wi) => (
                <div key={wi} className="flex flex-col gap-1">
                  {w.map((cell, di) => {
                    const v = cell?.value || 0
                    return (
                      <div
                        key={di}
                        title={cell?.date ? `${cell.date} — ${formatBRL(v)}` : ''}
                        className="w-3 h-3 rounded-[3px] border border-neutral-200/50"
                        style={{ backgroundColor: heatColor(v, maxDaily) }}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="text-xs text-neutral-500 mt-2">Quanto mais escuro, maior o gasto do dia.</div>
          </div>
        </div>
      </section>

      {/* 3) Top variações por categoria */}
      <section className="bg-white rounded-xl shadow-card p-4">
        <h2 className="text-lg font-semibold mb-3">Categorias com maior variação (mês vs. média 6 meses)</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[560px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-3">Categoria</th>
                <th className="py-2 px-3">Mês atual</th>
                <th className="py-2 px-3">Média 6 meses</th>
                <th className="py-2 px-3">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {catRows.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-neutral-500">Sem dados suficientes.</td></tr>
              )}
              {catRows.map((r) => {
                const pos = r.diff <= 0 // gasto menor é “positivo”
                return (
                  <tr key={r.name} className="border-b last:border-0">
                    <td className="py-2 px-3">{r.name}</td>
                    <td className="py-2 px-3">{formatBRL(r.current)}</td>
                    <td className="py-2 px-3">{formatBRL(r.avg6)}</td>
                    <td className={`py-2 px-3 ${pos ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {pos ? '↓ ' : '↑ '}{formatBRL(Math.abs(r.diff))}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4) Projeção de fatura de cartões */}
      <section className="bg-white rounded-xl shadow-card p-4">
        <h2 className="text-lg font-semibold mb-2">Fatura de cartões (projeção do mês)</h2>
        <div className="text-sm text-neutral-600 mb-2">
          Acumulado até hoje: <strong>{formatBRL(cardMonthSpend)}</strong> — Projeção até o fim do mês: <strong>{formatBRL(proj)}</strong>
        </div>
        <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-2 bg-rose-500"
            style={{ width: `${progressPct}%` }}
            aria-label={`Progresso ${progressPct}%`}
          />
        </div>
        <div className="text-xs text-neutral-500 mt-2">
          Método: média diária × dias do mês (simples). Podemos trocar por um modelo que exclui dias atípicos.
        </div>
      </section>
    </main>
  )
}
