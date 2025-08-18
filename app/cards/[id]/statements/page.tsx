// app/cards/[id]/statements/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { generateStatement, payStatement } from '../../actions'

type Statement = {
  id: string
  cycle_start: string
  cycle_end: string
  due_date: string | null
  status: 'closed' | 'paid' | string | null
  amount_total: number | null
}

export default async function CardStatementsPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para ver faturas.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const { data: card, error: cardErr } = await supabase
    .from('cards')
    .select('id, name, account_id')
    .eq('user_id', user.id)
    .eq('id', params.id)
    .single()
  if (cardErr || !card) return notFound()

  const { data: stmts, error: stErr } = await supabase
    .from('card_statements')
    .select('id, cycle_start, cycle_end, due_date, status, amount_total')
    .eq('user_id', user.id)
    .eq('card_id', card.id)
    .order('cycle_end', { ascending: false })
    .limit(24)

  if (stErr) {
    console.error('[statements/page] list error:', stErr)
  }

  // contas para pagar (evita pagar a partir da própria conta do cartão)
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type')
    .eq('user_id', user.id)
    .neq('id', card.account_id)
    .in('type', ['wallet', 'checking', 'savings', 'other']) // evita usar 'credit'
    .order('name', { ascending: true })

  // wrappers server actions
  const doGenerate = async () => {
    'use server'
    const { generateStatement } = await import('../../actions')
    await generateStatement(params.id)
  }

  const doPay = async (fd: FormData) => {
    'use server'
    const { payStatement } = await import('../../actions')
    const statementId = (fd.get('statementId') ?? '').toString()
    const payFromAccountId = (fd.get('payFromAccountId') ?? '').toString()
    if (!statementId || !payFromAccountId) throw new Error('Dados inválidos')
    await payStatement(statementId, payFromAccountId)
  }

  const list = (stmts ?? []) as Statement[]

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Faturas — {card.name ?? 'Cartão'}</h1>
          <p className="text-sm text-neutral-500">{list.length} ciclo(s)</p>
        </div>
        <div className="flex gap-2">
          <form action={doGenerate}>
            <button className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white">
              Gerar/Atualizar fatura do ciclo atual
            </button>
          </form>
          <Link href="/cards" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">Voltar</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr className="text-left">
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    {new Date(s.cycle_start).toLocaleDateString('pt-BR')} — {new Date(s.cycle_end).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">{s.due_date ? new Date(s.due_date).toLocaleDateString('pt-BR') : '—'}</td>
                  <td className="py-3 px-4">{formatBRL(s.amount_total ?? 0)}</td>
                  <td className="py-3 px-4">{s.status === 'paid' ? 'Paga' : 'Fechada'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      {s.status !== 'paid' && (accounts?.length ?? 0) > 0 ? (
                        <form action={doPay} className="flex items-center gap-2">
                          <input type="hidden" name="statementId" value={s.id} />
                          <select name="payFromAccountId" className="rounded-lg border px-2 py-1">
                            {accounts!.map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          <button className="px-3 py-1.5 rounded-lg border bg-emerald-500 hover:bg-emerald-600 text-white">
                            Marcar como paga
                          </button>
                        </form>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Nenhuma fatura gerada ainda.
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
