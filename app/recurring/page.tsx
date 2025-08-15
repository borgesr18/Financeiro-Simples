import { createClient } from '@/lib/supabase/server'

export default async function Recurring() {
  const supabase = createClient()
  const { data } = await supabase.from('recurring_rules').select('*').order('next_date')
  return (
    <main className="card">
      <h1>Regras de recorrência</h1>
      <ul className="mt-4 space-y-2">
        {(data ?? []).map((r:any) => (
          <li key={r.id} className="flex justify-between border border-slate-800 rounded-xl p-3">
            <div>
              <p className="font-medium">{r.description}</p>
              <p className="text-sm text-slate-400">{r.frequency} • próxima: {r.next_date}</p>
            </div>
            <div className="text-right">
              <p>{Number(r.amount).toFixed(2)}</p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
