import { createClient } from '@/lib/supabase/server'

export default async function Budget() {
  const supabase = createClient()
  const { data } = await supabase.rpc('budget_summary_current_month')
  return (
    <main className="card">
      <h1>Orçamento do mês</h1>
      <table className="mt-4 w-full text-sm">
        <thead><tr><th className="text-left">Categoria</th><th className="text-right">Planejado</th><th className="text-right">Realizado</th><th className="text-right">Variação</th></tr></thead>
        <tbody>
          {(data ?? []).map((row: any) => (
            <tr key={row.category} className="border-t border-slate-800">
              <td>{row.category}</td>
              <td className="text-right">{Number(row.planned).toFixed(2)}</td>
              <td className="text-right">{Number(row.realized).toFixed(2)}</td>
              <td className="text-right">{Number(row.variance).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
