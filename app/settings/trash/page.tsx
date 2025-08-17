// app/settings/trash/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { softDeleteAction, restoreAction, purgeAction as hardDeleteAction } from './actions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Account = { id: string; name: string; type: string; deleted_at: string | null }
type Simple = { id: string; name: string; deleted_at: string | null }
type Tx = { id: string; description: string | null; deleted_at: string | null }
type Budget = {
  id: string
  year: number
  month: number
  deleted_at: string | null
  categories: { name: string }[] | null
}
type Goal = { id: string; name: string; deleted_at: string | null }
type Card = { id: string; label: string | null; last4: string | null; deleted_at: string | null }
type Investment = { id: string; name: string; deleted_at: string | null }

function fmtWhen(ts: string | null) {
  if (!ts) return '—'
  try {
    return format(new Date(ts), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return ts
  }
}

export default async function TrashPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para acessar a lixeira.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  // Contas
  const { data: accData } = await supabase
    .from('accounts')
    .select('id,name,type,deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  const accounts: Account[] = accData ?? []

  // Cartões
  const { data: cardData } = await supabase
    .from('cards')
    .select('id,label,last4,deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  const cards: Card[] = cardData ?? []

  // Lançamentos
  const { data: txData } = await supabase
    .from('transactions')
    .select('id,description,deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  const txs: Tx[] = txData ?? []

  // Categorias
  const { data: catData } = await supabase
    .from('categories')
    .select('id,name,deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  const categories: Simple[] = catData ?? []

  // Orçamentos
  const { data: budData } = await supabase
    .from('budgets')
    .select('id,year,month,deleted_at,categories(name)')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  const budgets: Budget[] = budData ?? []

  // Metas
  const { data: goalData } = await supabase
    .from('goals')
    .select('id,name,deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  const goals: Goal[] = goalData ?? []

  // Investimentos
  const { data: invData } = await supabase
    .from('investments')
    .select('id,name,deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false })
  const investments: Investment[] = invData ?? []

  return (
    <main className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lixeira</h1>
        <Link href="/settings" className="text-sm text-neutral-500 hover:text-neutral-700">
          ← Voltar às configurações
        </Link>
      </div>

      {/* CONTAS */}
      <Section
        title="Contas"
        rows={(accounts ?? []).map(a => ({
          id: a.id,
          primary: a.name,
          secondary: a.type,
          when: a.deleted_at,
          entity: 'accounts' as const,
        }))}
      />

      {/* CARTÕES */}
      <Section
        title="Cartões"
        rows={(cards ?? []).map(c => ({
          id: c.id,
          primary: c.label || 'Cartão',
          secondary: c.last4 ? `**** ${c.last4}` : '—',
          when: c.deleted_at,
          entity: 'cards' as const,
        }))}
      />

      {/* LANÇAMENTOS */}
      <Section
        title="Lançamentos"
        rows={(txs ?? []).map(t => ({
          id: t.id,
          primary: t.description || '(sem descrição)',
          secondary: '',
          when: t.deleted_at,
          entity: 'transactions' as const,
        }))}
      />

      {/* CATEGORIAS */}
      <Section
        title="Categorias"
        rows={(categories ?? []).map(c => ({
          id: c.id,
          primary: c.name,
          secondary: '',
          when: c.deleted_at,
          entity: 'categories' as const,
        }))}
      />

      {/* ORÇAMENTOS */}
      <Section
        title="Orçamentos"
        rows={(budgets ?? []).map(b => ({
          id: b.id,
          primary: b.categories?.[0]?.name
            ? `Categoria: ${b.categories[0].name}`
            : 'Categoria (indefinida)',
          secondary: `${String(b.month).padStart(2, '0')}/${b.year}`,
          when: b.deleted_at,
          entity: 'budgets' as const,
        }))}
      />

      {/* METAS */}
      <Section
        title="Metas"
        rows={(goals ?? []).map(g => ({
          id: g.id,
          primary: g.name,
          secondary: '',
          when: g.deleted_at,
          entity: 'goals' as const,
        }))}
      />

      {/* INVESTIMENTOS */}
      <Section
        title="Investimentos"
        rows={(investments ?? []).map(i => ({
          id: i.id,
          primary: i.name,
          secondary: '',
          when: i.deleted_at,
          entity: 'investments' as const,
        }))}
      />
    </main>
  )
}

function Section({
  title,
  rows,
}: {
  title: string
  rows: {
    id: string
    primary: string
    secondary: string
    when: string | null
    entity:
      | 'accounts'
      | 'cards'
      | 'transactions'
      | 'categories'
      | 'budgets'
      | 'goals'
      | 'investments'
  }[]
}) {
  if (!rows || rows.length === 0) return null

  return (
    <section className="bg-white rounded-xl shadow-card overflow-hidden">
      <header className="px-4 py-3 border-b bg-neutral-50">
        <h2 className="text-sm font-semibold">{title}</h2>
      </header>
      <div className="overflow-x-auto">
        <table className="min-w-[720px] w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Detalhe</th>
              <th className="py-3 px-4">Excluído em</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-3 px-4">{r.primary}</td>
                <td className="py-3 px-4 text-neutral-500">{r.secondary || '—'}</td>
                <td className="py-3 px-4 text-neutral-500">{fmtWhen(r.when)}</td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <form action={restoreAction}>
                      <input type="hidden" name="entity" value={r.entity} />
                      <input type="hidden" name="id" value={r.id} />
                      <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                        Restaurar
                      </button>
                    </form>
                    <form action={hardDeleteAction}>
                      <input type="hidden" name="entity" value={r.entity} />
                      <input type="hidden" name="id" value={r.id} />
                      <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                        Excluir definitivamente
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
