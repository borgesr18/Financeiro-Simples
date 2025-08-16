// app/(app)/banking/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getAccountsWithBalances } from '@/lib/accounts'
import { deleteAccount } from './actions'
import { AccountIcon } from '@/components/account-icons'

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
  const total = accounts.filter(a=>!a.archived).reduce((acc, a) => acc + (a.balance || 0), 0)

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contas & Saldos</h1>
          <p className="text-sm text-neutral-500">Total (ativas): R$ {total.toFixed(2)}</p>
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
                const color = a.color_hex || '#e5e7eb' // cinza claro default
                return (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {/* Badge com cor + ícone */}
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
                          {/* pequena legenda com o slug do ícone — opcional */}
                          {/* <div className="text-xs text-neutral-500 truncate">{a.icon_slug || '—'}</div> */}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{TYPE_LABEL[a.type] ?? a.type}</td>
                    <td className="py-3 px-4">{a.institution ?? '—'}</td>
                    <td className={`py-3 px-4 ${a.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      R$ {a.balance.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/banking/${a.id}/edit`} className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Editar</Link>
                        {!a.archived && (
                          <form action={deleteAccount}>
                            <input type="hidden" name="id" value={a.id} />
                            <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                              Arquivar
                            </button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">Nenhuma conta cadastrada.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

