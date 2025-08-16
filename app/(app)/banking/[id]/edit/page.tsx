// app/(app)/banking/[id]/edit/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateAccount } from '../../actions'
import IconPicker from '@/components/IconPicker'
import ColorField from '@/components/ColorField'

export default async function EditAccountPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: acc } = await supabase
    .from('accounts')
    .select('id, name, type, institution, color_hex, icon_slug, currency, archived, created_at')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!acc) {
    return (
      <main className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Conta não encontrada.</p>
          <Link href="/banking" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Voltar</Link>
        </div>
      </main>
    )
  }

  const { data: balRow } = await supabase
    .from('v_account_balances')
    .select('balance')
    .eq('account_id', acc.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const balance = Number(balRow?.balance ?? 0)

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
        {/* Barra de título + ações (Salvar sempre visível) */}
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-semibold">Editar conta</h1>
            <p className="text-sm text-neutral-500">
              Criada em {new Date(acc.created_at).toLocaleDateString()} · Saldo atual:{' '}
              <span className={balance < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                R$ {balance.toFixed(2)}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/banking" className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">Voltar</Link>
            {/* botão de submit que envia o form pelo atributo form */}
            <button
              type="submit"
              form="account-edit-form"
              className="px-4 py-2 bg-sky-500 text-white rounded-lg"
            >
              Salvar
            </button>
          </div>
        </div>

        {/* Form principal */}
        <form id="account-edit-form" action={updateAccount} className="space-y-4">
          <input type="hidden" name="id" value={acc.id} />

          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              name="name"
              defaultValue={acc.name ?? ''}
              className="w-full rounded border px-3 py-2"
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Tipo</label>
            <select
              name="type"
              defaultValue={acc.type ?? 'other'}
              className="w-full rounded border px-3 py-2"
            >
              <option value="wallet">Carteira</option>
              <option value="checking">Conta corrente</option>
              <option value="savings">Poupança</option>
              <option value="credit">Cartão de crédito</option>
              <option value="investment">Investimento</option>
              <option value="other">Outra</option>
            </select>
          </div>

          <div>
            <label className="block text-sm mb-1">Instituição (opcional)</label>
            <input
              name="institution"
              defaultValue={acc.institution ?? ''}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          {/* Cor & Ícone lado a lado; o card mais largo evita “aperto” */}
          <div className="grid md:grid-cols-2 gap-4">
            <ColorField name="color_hex" value={acc.color_hex ?? '#22c55e'} label="Cor" />
            <IconPicker name="icon_slug" value={acc.icon_slug ?? 'wallet'} label="Ícone" />
          </div>

          <div>
            <label className="block text-sm mb-1">Moeda</label>
            <input
              name="currency"
              defaultValue={acc.currency ?? 'BRL'}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input id="archived" name="archived" type="checkbox" defaultChecked={!!acc.archived} />
            <label htmlFor="archived" className="text-sm">Arquivar conta</label>
          </div>

          {/* Rodapé sticky com ações (fica visível mesmo com muito conteúdo) */}
          <div className="sticky bottom-0 -mx-6 px-6 pt-4 border-t bg-white flex gap-2">
            <button className="px-4 py-2 bg-sky-500 text-white rounded-lg">Salvar mudanças</button>
            <Link href="/banking" className="px-4 py-2 rounded-lg border hover:bg-neutral-50">Cancelar</Link>
          </div>
        </form>
      </div>
    </main>
  )
}


