// app/(app)/banking/[id]/edit/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import IconColorPicker from '@/components/IconColorPicker'

export const dynamic = 'force-dynamic'

type Account = {
  id: string
  name: string
  type: 'wallet' | 'checking' | 'savings' | 'credit' | 'investment' | 'other'
  institution: string | null
  currency: string | null
  color_hex: string | null
  icon_slug: string | null
  archived: boolean
}

const ACCOUNT_TYPES: { value: Account['type']; label: string }[] = [
  { value: 'wallet',      label: 'Carteira' },
  { value: 'checking',    label: 'Conta Corrente' },
  { value: 'savings',     label: 'Poupança' },
  { value: 'credit',      label: 'Cartão de Crédito' },
  { value: 'investment',  label: 'Investimentos' },
  { value: 'other',       label: 'Outra' },
]

export default async function EditAccountPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data: acc, error } = await supabase
    .from('accounts')
    .select('id, name, type, institution, currency, color_hex, icon_slug, archived')
    .eq('id', params.id)
    .eq('user_id', user!.id)
    .single()

  if (error || !acc) {
    console.error('[banking/edit] conta não encontrada', error)
    notFound()
  }

  // ---- Server Action wrappers (apenas FormData) ----
  const doUpdate = async (fd: FormData) => { 'use server'
    const { updateAccount } = await import('../../actions')
    await updateAccount(fd)
  }

  const doArchive = async (fd: FormData) => { 'use server'
    const { archiveAccount } = await import('../../actions')
    await archiveAccount(fd)
  }

  const doDelete = async (fd: FormData) => { 'use server'
    const { deleteAccount } = await import('../../actions')
    await deleteAccount(fd)
  }

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">
              Editar conta
            </h2>
            <p className="text-sm text-neutral-500">
              Ajuste as informações da sua conta. {acc.archived && <span className="text-amber-600 font-medium">Esta conta está arquivada.</span>}
            </p>
          </div>
          <Link
            href="/banking"
            className="px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
          >
            Voltar
          </Link>
        </div>

        {/* Form principal */}
        <form id="account-edit-form" action={doUpdate} className="space-y-4">
          <input type="hidden" name="id" value={acc.id} />

          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              name="name"
              required
              defaultValue={acc.name}
              className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              placeholder="Ex.: Nubank, Caixa, Carteira..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <select
                name="type"
                defaultValue={acc.type}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              >
                {ACCOUNT_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Instituição (opcional)</label>
              <input
                name="institution"
                defaultValue={acc.institution ?? ''}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
                placeholder="Ex.: Banco do Brasil"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Moeda</label>
              <select
                name="currency"
                defaultValue={acc.currency ?? 'BRL'}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              >
                <option value="BRL">BRL — Real</option>
                <option value="USD">USD — Dólar</option>
                <option value="EUR">EUR — Euro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1">Status</label>
              <input
                type="text"
                readOnly
                value={acc.archived ? 'Arquivada' : 'Ativa'}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50 text-neutral-600"
              />
              {/* Enviamos archived via outro form (toggle) */}
            </div>
          </div>

          {/* Aparência (client component) */}
          <IconColorPicker
            label="Aparência"
            hint="Escolha um ícone e uma cor para identificar a conta visualmente."
            nameColor="color_hex"
            nameIcon="icon_slug"
            defaultColorHex={acc.color_hex ?? '#6b7280'}
            defaultIconSlug={acc.icon_slug ?? 'FaWallet'}
          />

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Salvar alterações
            </button>
            <Link
              href="/banking"
              className="px-4 py-2 border rounded-lg hover:bg-neutral-50"
            >
              Cancelar
            </Link>
          </div>
        </form>

        {/* Ações secundárias: Arquivar / Reativar */}
        <div className="flex items-center gap-3">
          <form action={doArchive}>
            <input type="hidden" name="id" value={acc.id} />
            <input type="hidden" name="archived" value={acc.archived ? 'false' : 'true'} />
            <button
              className="px-3 py-2 rounded-lg border border-neutral-200 text-neutral-700 hover:bg-neutral-50"
            >
              {acc.archived ? 'Reativar conta' : 'Arquivar conta'}
            </button>
          </form>

          {/* Excluir conta */}
          <form action={doDelete}>
            <input type="hidden" name="id" value={acc.id} />
            <button
              className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
            >
              Excluir conta
            </button>
          </form>
        </div>

        <p className="text-xs text-neutral-500">
          Dica: se a conta tiver lançamentos vinculados, a exclusão pode ser bloqueada. Use “Arquivar conta” para ocultá-la sem perder histórico.
        </p>
      </div>
    </main>
  )
}

