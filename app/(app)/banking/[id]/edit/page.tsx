// app/(app)/banking/[id]/edit/page.tsx
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

type Account = {
  id: string
  user_id: string
  name: string
  type: 'wallet' | 'checking' | 'savings' | 'credit' | 'investment' | 'other'
  institution: string | null
  color_hex: string | null
  icon_slug: string | null
  archived?: boolean | null
}

const TYPE_LABEL: Record<string, string> = {
  wallet: 'Carteira',
  checking: 'Conta corrente',
  savings: 'Poupança',
  credit: 'Cartão de crédito',
  investment: 'Investimento',
  other: 'Outra',
}

export default async function EditAccountPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: acc, error } = await supabase
    .from('accounts')
    .select(
      'id, user_id, name, type, institution, color_hex, icon_slug, archived'
    )
    .eq('user_id', user!.id)
    .eq('id', params.id)
    .maybeSingle<Account>()

  if (error || !acc) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-2">
          <h1 className="text-xl font-semibold">Conta não encontrada</h1>
          <p className="text-sm text-neutral-600">
            Verifique se o link está correto.
          </p>
          <div className="pt-2">
            <Link
              href="/banking"
              className="px-3 py-2 rounded-lg border hover:bg-neutral-50"
            >
              Voltar
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // === Server actions locais (wrappers) ===

  // Atualizar conta — updateAccount espera apenas (fd: FormData)
  const doUpdate = async (fd: FormData) => {
    'use server'
    const { updateAccount } = await import('../../actions')
    if (!fd.get('id')) fd.set('id', acc.id)
    await updateAccount(fd)
  }

  // Enviar para a lixeira (soft delete)
  const doArchive = async (fd: FormData) => {
    'use server'
    const { softDeleteAction } = await import('@/app/settings/trash/actions')
    const f = new FormData()
    f.set('entity', 'accounts')
    f.set('id', String(fd.get('id') || acc.id))
    await softDeleteAction(f)
  }

  // Excluir definitivamente (purge)
  const doDelete = async (fd: FormData) => {
    'use server'
    const { purgeAction } = await import('@/app/settings/trash/actions')
    const f = new FormData()
    f.set('entity', 'accounts')
    f.set('id', String(fd.get('id') || acc.id))
    await purgeAction(f)
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar conta</h1>
        <Link
          href="/banking"
          className="px-3 py-2 rounded-lg border hover:bg-neutral-50"
        >
          Voltar
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Form principal */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-card p-6 space-y-4">
          <form id="account-edit-form" action={doUpdate} className="space-y-4">
            <input type="hidden" name="id" value={acc.id} />

            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Nome
              </label>
              <input
                name="name"
                defaultValue={acc.name}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Tipo
                </label>
                <input
                  defaultValue={TYPE_LABEL[acc.type] ?? acc.type}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 bg-neutral-50 text-neutral-500"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Instituição
                </label>
                <input
                  name="institution"
                  defaultValue={acc.institution ?? ''}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Cor (hex)
                </label>
                <input
                  name="color_hex"
                  defaultValue={acc.color_hex ?? ''}
                  placeholder="#aabbcc"
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Ícone (slug)
                </label>
                <input
                  name="icon_slug"
                  defaultValue={acc.icon_slug ?? ''}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-300"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </div>

        {/* Ações perigosas */}
        <div className="bg-white rounded-xl shadow-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Ações</h2>

          {/* Enviar para lixeira */}
          <form action={doArchive} className="space-y-2">
            <input type="hidden" name="id" value={acc.id} />
            <input type="hidden" name="entity" value="accounts" />
            <button className="w-full px-3 py-2 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50">
              Enviar para lixeira
            </button>
          </form>

          {/* Excluir definitivamente */}
          <form action={doDelete} className="space-y-2">
            <input type="hidden" name="id" value={acc.id} />
            <input type="hidden" name="entity" value="accounts" />
            <button className="w-full px-3 py-2 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
              Excluir definitivamente
            </button>
          </form>

          <p className="text-xs text-neutral-500">
            Enviar para a lixeira marca <code>deleted_at</code>. Excluir
            definitivamente remove o registro (e, no caso de contas, também
            apaga os lançamentos ligados a ela).
          </p>
        </div>
      </div>
    </main>
  )
}
