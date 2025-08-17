// app/(app)/banking/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAccountsWithBalances } from '@/lib/accounts'
import { deleteAccount } from './actions'
import { AccountIcon } from '@/components/account-icons'
import { formatBRL } from '@/lib/format'

const TYPE_LABEL: Record<string, string> = {
  wallet: 'Carteira',
  checking: 'Conta corrente',
  savings: 'Poupança',
  credit: 'Cartão de crédito',
  investment: 'Investimento',
  other: 'Outra',
}

export default async function BankingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar contas.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const accounts = await getAccountsWithBalances()
  const total = accounts
    .filter(a => !a.archived)
    .reduce((acc, a) => acc + (a.balance || 0), 0)

  // ação server para enviar itens à Lixeira
  const sendToTrash = async (fd: FormData) => {
    'use server'
    const { softDeleteAction } = await import('@/app/settings/trash/actions')
    await softDeleteAction(fd)
  }

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contas & Saldos</h1>
          <p className="text-sm text-neutral-500">Total (ativas): {formatBRL(total)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/banking/transfer" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg">Transferir</Link>
          <Link href="/banking/new" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">Nova conta</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Conta</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Instituição</th>
                <th className="py-3 px-4">Saldo</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(a => {
                const color = a.color_hex || '#e5e7eb'
                const positive = (a.balance ?? 0) >= 0
                return (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.08)' }}
                          title={a.name}
                        >
                          <AccountIcon slug={a.icon_slug} className="text-[18px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">
                            {a.name}{a.archived ? ' (arquivada)' : ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{TYPE_LABEL[a.type] ?? a.type}</td>
                    <td className="py-3 px-4">{a.institution ?? '—'}</td>
                    <td className={`py-3 px-4 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatBRL(a.balance)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/banking/${a.id}/edit`}
                          className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
                        >
                          Editar
                        </Link>

                        {/* Arquivar (flag archived) */}
                        {!a.archived && (
                          <form action={deleteAccount}>
                            <input type="hidden" name="id" value={a.id} />
                            <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                              Arquivar
                            </button>
                          </form>
                        )}

                        {/* Enviar para Lixeira (soft-delete com deleted_at) */}
                        <form action={sendToTrash}>
                          <input type="hidden" name="entity" value="accounts" />
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="back" value="/banking" />
                          <button className="px-3 py-1.5 rounded-lg border border-rose-400 text-rose-700 hover:bg-rose-50">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
                    Nenhuma conta cadastrada.
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
