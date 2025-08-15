import { createClient } from '@/lib/supabase/server'

export default async function Settings() {
  const supabase = createClient()
  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase.from('accounts').select('id,name,type,initial_balance').order('name'),
    supabase.from('categories').select('id,name,kind,is_fixed').order('name')
  ])

  return (
    <main className="grid gap-6 md:grid-cols-2">
      <section className="card">
        <h1>Contas</h1>
        <ul className="mt-3 space-y-2">
          {(accounts ?? []).map((a:any) => (
            <li key={a.id} className="flex justify-between border border-slate-800 rounded-xl p-3">
              <span>{a.name} <span className="text-slate-400">({a.type})</span></span>
              <span>Inicial: R$ {Number(a.initial_balance).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h1>Categorias</h1>
        <ul className="mt-3 space-y-2">
          {(categories ?? []).map((c:any) => (
            <li key={c.id} className="flex justify-between border border-slate-800 rounded-xl p-3">
              <span>{c.name}</span>
              <span className="text-slate-400">{c.kind} {c.is_fixed ? '• fixa' : ''}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
