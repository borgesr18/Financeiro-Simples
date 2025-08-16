// app/cards/[id]/statements/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { generateStatement, payStatement } from '../../actions'

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

  const { data: card } = await supabase
    .from('cards')
    .select('id, name, brand, last4, account_id')
    .eq('user_id', user.id)
    .eq('id', params.id)
    .single()
  if (!card) return notFound()

  const { data: statements } = await supabase
    .from('card_statements')
    .select('id, cycle_start, cycle_end, due_date, status, amount_total')
    .eq('user_id', user.id)
    .eq('card_id', card.id)
    .order('cycle_end', { ascending: false })

  // listar contas para escolher de onde pagar
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, type')
    .eq('user_id', user.id)
    .in('type', ['wallet','checking','savings']) // contas pagadoras
    .order('name')

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Faturas — {card.name}{card.brand ? ` • ${card.brand}` : ''}</h1>
          <p className="text-sm text-neutral-500">Final {card.last4 ?? '—'}</p>
        </div>
        <div className="flex items-center gap-2">
          <form action={async () => { 'use server'; await generateStatement(card.id) }}>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">Gerar fatura atual</button>
          </form>
          <Link href="/cards" className="px-4 py-2 border rounded-lg">Voltar</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4">Vencimento</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 w-72"></th>
              </tr>
            </thead>
            <tbody>
              {(statements ?? []).map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-3 px-4">
                    {new Date(s.cycle_start).toLocaleDateString('pt-BR')}
                    {' — '}
                    {new Date(s.cycle_end).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="py-3 px-4">{new Date(s.due_date).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-4">{formatBRL(s.amount_total)}</td>
                  <td className="py-3 px-4">{s.status}</td>
                  <td className="py-3 px-4">
                    {s.status !== 'paid' ? (
                      <div className="flex items-center gap-2">
                        <form action={async (fd: FormData) => { 'use server'
                          const from = fd.get('pay_from')?.toString() || ''
                          if (from) await payStatement(s.id, from)
                        }} className="flex items-center gap-2">
                          <select name="pay_from" className="px-2 py-1 border rounded-lg bg-neutral-50">
                            <option value="">Pagar com...</option>
                            {(accounts ?? []).map(a => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </select>
                          <button className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg">Pagar</button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {(statements ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Nenhuma fatura gerada ainda. Clique em “Gerar fatura atual”.
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
