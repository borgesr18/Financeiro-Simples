export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatBRL } from '@/lib/format'
import { softDeleteAction } from '@/app/settings/trash/trash-actions'
import { AccountIcon } from '@/components/account-icons'

type Row = {
  id: string
  name: string
  type: string
  institution: string | null
  currency: string
  color_hex: string | null
  icon_slug: string | null
  // caso tenha uma coluna com valor atual/saldo do investimento:
  current_value?: number | null
}

const TYPE_LABEL: Record<string, string> = {
  stock: 'Ação',
  fund: 'Fundo',
  crypto: 'Cripto',
  fixed_income: 'Renda fixa',
  real_estate: 'Imobiliário',
  other: 'Outro',
}

export default async function InvestmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar investimentos.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const { data, error } = await supabase
    .from('investments')
    .select('id,name,type,institution,currency,color_hex,icon_slug,current_value')
    .is('deleted_at', null)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[investments:list] supabase error:', error)
  }

  const rows = (data ?? []) as Row[]

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Investimentos</h1>
          <p className="text-sm text-neutral-500">
            {rows.length} item{rows.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/investments/new" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">Novo investimento</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Ativo</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Instituição</th>
                <th className="py-3 px-4">Moeda</th>
                <th className="py-3 px-4">Valor</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const color = r.color_hex || '#e5e7eb'
                const val = r.current_value ?? 0
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-xl border flex items-center justify-center shrink-0"
                          style={{ backgroundColor: color, borderColor: 'rgba(0,0,0,0.08)' }}
                          title={r.name}
                        >
                          <AccountIcon slug={r.icon_slug} className="text-[18px]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{TYPE_LABEL[r.type] ?? r.type}</td>
                    <td className="py-3 px-4">{r.institution ?? '—'}</td>
                    <td className="py-3 px-4">{r.currency}</td>
                    <td className="py-3 px-4">{formatBRL(val)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Link href={`/investments/${r.id}/edit`} className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Editar</Link>

                        {/* Enviar para lixeira */}
                        <form action={softDeleteAction}>
                          <input type="hidden" name="entity" value="investments" />
                          <input type="hidden" name="id" value={r.id} />
                          <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                            Excluir
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-neutral-500">Nenhum investimento cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
