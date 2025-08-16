// app/investments/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getPositions } from '@/lib/investments'
import Link from 'next/link'

function brl(n: number | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
    .format(Number(n || 0))
}

export default async function InvestmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para ver seus investimentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const positions = await getPositions()
  const totals = positions.reduce((acc, p) => {
    acc.invested += Number(p.invested || 0)
    acc.market += Number(p.market_value || 0)
    acc.pnl += Number(p.unrealized_pnl || 0)
    return acc
  }, { invested: 0, market: 0, pnl: 0 })

  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Investimentos</h2>
          <div className="flex gap-2">
            <Link href="/investments/new" className="px-3 py-2 bg-primary-500 text-white rounded-lg">Novo movimento</Link>
            <Link href="/banking" className="px-3 py-2 bg-neutral-100 rounded-lg">Contas</Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-card">
            <p className="text-xs text-neutral-500">Investido</p>
            <p className="text-lg font-semibold">{brl(totals.invested)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-card">
            <p className="text-xs text-neutral-500">Valor de mercado</p>
            <p className="text-lg font-semibold">{brl(totals.market)}</p>
          </div>
          <div className={`bg-white rounded-xl p-4 shadow-card`}>
            <p className="text-xs text-neutral-500">P/L não realizado</p>
            <p className={`text-lg font-semibold ${totals.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {brl(totals.pnl)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="text-left p-3">Ativo</th>
                <th className="text-right p-3">Qtd</th>
                <th className="text-right p-3">PM</th>
                <th className="text-right p-3">Último</th>
                <th className="text-right p-3">Investido</th>
                <th className="text-right p-3">Mercado</th>
                <th className="text-right p-3">P/L</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p) => (
                <tr key={p.asset_id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{p.ticker}</div>
                    <div className="text-xs text-neutral-500">{p.name}</div>
                  </td>
                  <td className="p-3 text-right">{Number(p.qty).toLocaleString('pt-BR')}</td>
                  <td className="p-3 text-right">{brl(p.avg_price)}</td>
                  <td className="p-3 text-right">{p.last_price ? brl(p.last_price) : '—'}</td>
                  <td className="p-3 text-right">{brl(p.invested)}</td>
                  <td className="p-3 text-right">{brl(p.market_value)}</td>
                  <td className={`p-3 text-right ${p.unrealized_pnl >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {brl(p.unrealized_pnl)}
                  </td>
                </tr>
              ))}
              {positions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-neutral-500">
                    Nenhuma posição ainda. Lance sua primeira operação.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
