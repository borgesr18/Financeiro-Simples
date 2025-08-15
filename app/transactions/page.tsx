import { createClient } from '@/lib/supabase/server'

export default async function Transactions() {
  const supabase = createClient()
  const { data: items } = await supabase
    .from('transactions')
    .select('id,date,description,amount,categories(name),accounts(name)')
    .order('date', { ascending: false })
    .limit(50)

  return (
    <main className="card">
      <h1>Últimos lançamentos</h1>
      <table className="mt-4 w-full text-sm">
        <thead><tr><th className="text-left">Data</th><th className="text-left">Desc</th><th>Categoria</th><th>Conta</th><th className="text-right">Valor</th></tr></thead>
        <tbody>
          {(items ?? []).map((t: any) => (
            <tr key={t.id} className="border-t border-slate-800">
              <td>{t.date}</td>
              <td>{t.description}</td>
              <td className="text-center">{t.categories?.name ?? '-'}</td>
              <td className="text-center">{t.accounts?.name ?? '-'}</td>
              <td className="text-right">{Number(t.amount).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
