// app/settings/trash/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { hardDeleteAction, restoreAction } from './actions'

type Account = { id: string; name: string; type: string; deleted_at: string | null }
type Simple = { id: string; name: string; deleted_at: string | null }
type Tx = { id: string; description: string; deleted_at: string | null }

async function getData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, accounts: [], budgets: [], categories: [], goals: [], transactions: [] }

  const [acc, bud, cat, goa, tx] = await Promise.all([
    supabase.from('accounts').select('id,name,type,deleted_at').eq('user_id', user.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('budgets').select('id,category,deleted_at').eq('user_id', user.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('categories').select('id,name,deleted_at').eq('user_id', user.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('goals').select('id,name,deleted_at').eq('user_id', user.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
    supabase.from('transactions').select('id,description,deleted_at').eq('user_id', user.id).not('deleted_at', 'is', null).order('deleted_at', { ascending: false }),
  ])

  return {
    user,
    accounts: acc.data ?? [],
    budgets: (bud.data ?? []).map(b => ({ id: b.id, name: b.category, deleted_at: b.deleted_at })) as Simple[],
    categories: cat.data ?? [],
    goals: goa.data ?? [],
    transactions: tx.data ?? [],
  }
}

export default async function TrashPage() {
  const { user, accounts, budgets, categories, goals, transactions } = await getData()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para acessar a Lixeira.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const doRestore = async (fd: FormData) => { 'use server'; await restoreAction(fd) }
  const doHardDelete = async (fd: FormData) => { 'use server'; await hardDeleteAction(fd) }

  function Section<T extends { id: string; deleted_at: string | null }>(props: {
    title: string
    entity: 'accounts' | 'budgets' | 'categories' | 'goals' | 'transactions'
    headers: string[]
    rows: T[]
    render: (row: T) => React.ReactNode[]
  }) {
    const { title, entity, headers, rows, render } = props
    return (
      <section className="bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-medium mb-4">{title}</h2>
        {rows.length === 0 ? (
          <p className="text-sm text-neutral-500">Nada por aqui.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                {headers.map((h, i) => <th key={i} className="py-2">{h}</th>)}
                <th className="py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => {
                const cols = render(r)
                return (
                  <tr key={r.id}>
                    {cols.map((c, i) => <td key={i} className="py-2">{c}</td>)}
                    <td className="py-2 text-right">
                      <form action={doRestore} className="inline mr-2">
                        <input type="hidden" name="entity" value={entity} />
                        <input type="hidden" name="id" value={r.id} />
                        <button className="px-3 py-1 border rounded-lg hover:bg-neutral-50">Restaurar</button>
                      </form>
                      <details className="inline-block">
                        <summary className="px-3 py-1 border rounded-lg hover:bg-neutral-50 cursor-pointer inline-flex">
                          Excluir…
                        </summary>
                        <div className="mt-2 p-3 border rounded-lg bg-neutral-50">
                          <form action={doHardDelete} className="space-y-2">
                            <input type="hidden" name="entity" value={entity} />
                            <input type="hidden" name="id" value={r.id} />
                            {entity === 'accounts' ? (
                              <>
                                <label className="block text-xs text-neutral-600">Modo</label>
                                <select name="mode" className="w-full border rounded-lg px-2 py-1">
                                  <option value="if-empty">Excluir se não tiver lançamentos</option>
                                  <option value="move">Mover lançamentos para outra conta e excluir</option>
                                  <option value="purge">Apagar lançamentos e conta (irreversível)</option>
                                </select>
                                <label className="block text-xs text-neutral-600">Conta destino (para “Mover”)</label>
                                <input name="target_account_id" placeholder="UUID da conta destino" className="w-full border rounded-lg px-2 py-1" />
                              </>
                            ) : null}
                            <button className="w-full bg-red-600 text-white rounded-lg px-3 py-2">
                              Excluir permanentemente
                            </button>
                          </form>
                        </div>
                      </details>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </section>
    )
  }

  return (
    <main className="p-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Lixeira</h1>
          <Link href="/settings" className="text-sm text-neutral-600 hover:underline">Voltar às configurações</Link>
        </header>

        <Section<Account>
          title="Contas"
          entity="accounts"
          headers={['Nome', 'Tipo', 'Removido em']}
          rows={accounts}
          render={(a) => [a.name, a.type, a.deleted_at ? new Date(a.deleted_at).toLocaleString('pt-BR') : '—']}
        />

        <Section<Simple>
          title="Orçamentos"
          entity="budgets"
          headers={['Categoria', 'Removido em']}
          rows={budgets}
          render={(b) => [b.name, b.deleted_at ? new Date(b.deleted_at).toLocaleString('pt-BR') : '—']}
        />

        <Section<Simple>
          title="Categorias"
          entity="categories"
          headers={['Nome', 'Removido em']}
          rows={categories}
          render={(c) => [c.name, c.deleted_at ? new Date(c.deleted_at).toLocaleString('pt-BR') : '—']}
        />

        <Section<Simple>
          title="Metas"
          entity="goals"
          headers={['Nome', 'Removido em']}
          rows={goals}
          render={(g) => [g.name, g.deleted_at ? new Date(g.deleted_at).toLocaleString('pt-BR') : '—']}
        />

        <Section<Tx>
          title="Lançamentos"
          entity="transactions"
          headers={['Descrição', 'Removido em']}
          rows={transactions}
          render={(t) => [t.description || '—', t.deleted_at ? new Date(t.deleted_at).toLocaleString('pt-BR') : '—']}
        />
      </div>
    </main>
  )
}
