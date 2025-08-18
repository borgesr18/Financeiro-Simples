// app/investments/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { softDeleteAction } from '@/app/settings/trash/trash-actions'
import { formatBRL } from '@/lib/format'

type Investment = {
  id: string
  name: string | null
  type: string | null
  institution: string | null
  currency: string | null
  current_value: number | null
  color_hex: string | null
  icon_slug: string | null
  deleted_at: string | null
}

const TYPE_LABEL: Record<string, string> = {
  stock: 'Ação',
  fixed: 'Renda fixa',
  fund: 'Fundo',
  crypto: 'Cripto',
  realestate: 'Imobiliário',
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
    .select('id, name, type, institution, currency, current_value, color_hex, icon_slug, deleted_at')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  if (error) {
    console.error('[investments/page] list error:', error)
  }

  const list: Investment[] = data ?? []
  const total = list.reduce((acc, i) => acc + (Number(i.current_value) || 0), 0)

  return (
    <main className="p-6 space-y-4">
      <div className="flex items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Investimentos</h1>
          <p className="text-sm text-neutral-500">Total: {formatBRL(total)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/investments/new" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg">Novo</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[880px] w-full text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left border-b">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Instituição</th>
                <th className="py-3 px-4">Valor atual</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {list.map(i => (
                <tr key={i.id} className="border-b last:border-0">
                  <td className="py-3 px-4">{i.name ?? '—'}</td>
                  <td className="py-3 px-4">{TYPE_LABEL[i.type ?? 'other'] ?? (i.type ?? '—')}</td>
                  <td className="py-3 px-4">{i.institution ?? '—'}</td>
                  <td className="py-3 px-4">{formatBRL(i.current_value ?? 0)}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      <Link href={`/investments/${i.id}/edit`} className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                        Editar
                      </Link>
                      <form action={softDeleteAction}>
                        <input type="hidden" name="entity" value="investments" />
                        <input type="hidden" name="id" value={i.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Lixeira
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">Nenhum investimento cadastrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}

