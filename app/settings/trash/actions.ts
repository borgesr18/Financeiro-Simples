// app/settings/trash/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { restoreAction, hardDeleteAction } from './actions'

type Account = { id: string; name: string; type?: string; deleted_at: string | null }
type Simple = { id: string; name: string; deleted_at: string | null }
type Card = { id: string; name: string; deleted_at: string | null }

export default async function TrashPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para acessar a lixeira.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  // Busca todos os itens soft-deletados (deleted_at IS NOT NULL)
  const [
    accRes,
    txRes,
    catRes,
    budRes,
    goalRes,
    cardRes,
  ] = await Promise.all([
    supabase.from('accounts')
      .select('id,name,type,deleted_at')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase.from('transactions')
      .select('id,description:name,deleted_at') // alias p/ manter {id,name}
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase.from('categories')
      .select('id,name,deleted_at')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase.from('budgets')
      .select('id,category_id,deleted_at') // não temos "name" direto
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase.from('goals')
      .select('id,name,deleted_at')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
    supabase.from('cards')
      .select('id,name,deleted_at')
      .eq('user_id', user.id)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false }),
  ])

  const accounts = (accRes.data ?? []) as Account[]
  const transactions = ((txRes.data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name ?? r.description ?? '(sem descrição)',
    deleted_at: r.deleted_at ?? null,
  })) as Simple[])
  const categories = (catRes.data ?? []) as Simple[]

  // Budgets não tem "name" -> mostramos o id da categoria como identificação
  const budgets = ((budRes.data ?? []).map((b: any) => ({
    id: b.id,
    name: b.category_id ? `Categoria: ${b.category_id}` : '(sem categoria)',
    deleted_at: b.deleted_at ?? null,
  })) as Simple[])

  const goals = (goalRes.data ?? []) as Simple[]
  const cards = (cardRes.data ?? []) as Card[]

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Lixeira</h1>
          <p className="text-sm text-neutral-500">Restaure itens apagados ou exclua definitivamente.</p>
        </div>
        <Link href="/" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Voltar ao painel</Link>
      </div>

      {/* ACCOUNTS */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <header className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-medium">Contas ({accounts.length})</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Tipo</th>
                <th className="py-2 px-4">Apagado em</th>
                <th className="py-2 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{a.name}</td>
                  <td className="py-2 px-4">{a.type ?? '—'}</td>
                  <td className="py-2 px-4">{a.deleted_at ? new Date(a.deleted_at).toLocaleString('pt-BR') : '—'}</td>
                  <td className="py-2 px-4">
                    <div className="flex justify-end gap-2">
                      <form action={restoreAction}>
                        <input type="hidden" name="entity" value="accounts" />
                        <input type="hidden" name="id" value={a.id} />
                        <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Restaurar</button>
                      </form>
                      <form action={hardDeleteAction}>
                        <input type="hidden" name="entity" value="accounts" />
                        <input type="hidden" name="id" value={a.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir definitivamente
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={4} className="py-6 text-center text-neutral-500">Nenhuma conta na lixeira.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CARDS */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <header className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-medium">Cartões ({cards.length})</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Apagado em</th>
                <th className="py-2 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{c.name}</td>
                  <td className="py-2 px-4">{c.deleted_at ? new Date(c.deleted_at).toLocaleString('pt-BR') : '—'}</td>
                  <td className="py-2 px-4">
                    <div className="flex justify-end gap-2">
                      <form action={restoreAction}>
                        <input type="hidden" name="entity" value="cards" />
                        <input type="hidden" name="id" value={c.id} />
                        <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Restaurar</button>
                      </form>
                      <form action={hardDeleteAction}>
                        <input type="hidden" name="entity" value="cards" />
                        <input type="hidden" name="id" value={c.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir definitivamente
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {cards.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-neutral-500">Nenhum cartão na lixeira.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* TRANSACTIONS */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <header className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-medium">Lançamentos ({transactions.length})</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-4">Descrição</th>
                <th className="py-2 px-4">Apagado em</th>
                <th className="py-2 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{t.name}</td>
                  <td className="py-2 px-4">{t.deleted_at ? new Date(t.deleted_at).toLocaleString('pt-BR') : '—'}</td>
                  <td className="py-2 px-4">
                    <div className="flex justify-end gap-2">
                      <form action={restoreAction}>
                        <input type="hidden" name="entity" value="transactions" />
                        <input type="hidden" name="id" value={t.id} />
                        <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Restaurar</button>
                      </form>
                      <form action={hardDeleteAction}>
                        <input type="hidden" name="entity" value="transactions" />
                        <input type="hidden" name="id" value={t.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir definitivamente
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-neutral-500">Nenhum lançamento na lixeira.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <header className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-medium">Categorias ({categories.length})</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Apagado em</th>
                <th className="py-2 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{c.name}</td>
                  <td className="py-2 px-4">{c.deleted_at ? new Date(c.deleted_at).toLocaleString('pt-BR') : '—'}</td>
                  <td className="py-2 px-4">
                    <div className="flex justify-end gap-2">
                      <form action={restoreAction}>
                        <input type="hidden" name="entity" value="categories" />
                        <input type="hidden" name="id" value={c.id} />
                        <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Restaurar</button>
                      </form>
                      <form action={hardDeleteAction}>
                        <input type="hidden" name="entity" value="categories" />
                        <input type="hidden" name="id" value={c.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir definitivamente
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-neutral-500">Nenhuma categoria na lixeira.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* BUDGETS */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <header className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-medium">Orçamentos ({budgets.length})</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-4">Identificação</th>
                <th className="py-2 px-4">Apagado em</th>
                <th className="py-2 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(b => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{b.name}</td>
                  <td className="py-2 px-4">{b.deleted_at ? new Date(b.deleted_at).toLocaleString('pt-BR') : '—'}</td>
                  <td className="py-2 px-4">
                    <div className="flex justify-end gap-2">
                      <form action={restoreAction}>
                        <input type="hidden" name="entity" value="budgets" />
                        <input type="hidden" name="id" value={b.id} />
                        <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Restaurar</button>
                      </form>
                      <form action={hardDeleteAction}>
                        <input type="hidden" name="entity" value="budgets" />
                        <input type="hidden" name="id" value={b.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir definitivamente
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {budgets.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-neutral-500">Nenhum orçamento na lixeira.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* GOALS */}
      <section className="bg-white rounded-xl shadow-card overflow-hidden">
        <header className="px-4 py-3 border-b bg-neutral-50">
          <h2 className="font-medium">Metas ({goals.length})</h2>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Apagado em</th>
                <th className="py-2 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {goals.map(g => (
                <tr key={g.id} className="border-b last:border-0">
                  <td className="py-2 px-4">{g.name}</td>
                  <td className="py-2 px-4">{g.deleted_at ? new Date(g.deleted_at).toLocaleString('pt-BR') : '—'}</td>
                  <td className="py-2 px-4">
                    <div className="flex justify-end gap-2">
                      <form action={restoreAction}>
                        <input type="hidden" name="entity" value="goals" />
                        <input type="hidden" name="id" value={g.id} />
                        <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Restaurar</button>
                      </form>
                      <form action={hardDeleteAction}>
                        <input type="hidden" name="entity" value="goals" />
                        <input type="hidden" name="id" value={g.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir definitivamente
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {goals.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-neutral-500">Nenhuma meta na lixeira.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  )
}
