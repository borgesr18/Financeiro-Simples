import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, formatISO } from 'date-fns'

export default async function Home() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date()
  const from = formatISO(startOfMonth(today), { representation: 'date' })
  const to = formatISO(endOfMonth(today), { representation: 'date' })

  // sum of month
  const { data: totals } = await supabase.rpc('month_totals', { from_date: from, to_date: to })
  // top categories
  const { data: bycat } = await supabase.rpc('month_expense_by_category', { from_date: from, to_date: to })

  return (
    <main className="grid gap-6 md:grid-cols-3">
      <section className="card md:col-span-2">
        <h1>Resumo do mês</h1>
        {!user && <p className="mt-2 text-slate-300">Faça login para ver seus dados.</p>}
        {user && (
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="card"><h2>Entradas</h2><p className="mt-2 text-2xl">R$ {Number(totals?.income ?? 0).toFixed(2)}</p></div>
            <div className="card"><h2>Saídas</h2><p className="mt-2 text-2xl">R$ {Math.abs(Number(totals?.expense ?? 0)).toFixed(2)}</p></div>
            <div className="card"><h2>Saldo</h2><p className="mt-2 text-2xl">R$ {Number((totals?.income ?? 0) + (totals?.expense ?? 0)).toFixed(2)}</p></div>
          </div>
        )}
      </section>
      <section className="card">
        <h2>Maiores categorias</h2>
        <ul className="mt-2 space-y-2">
          {(bycat ?? []).map((row: any) => (
            <li key={row.name} className="flex justify-between">
              <span>{row.name}</span>
              <span>R$ {Number(row.spent).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
