export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IconColorPicker from '@/components/IconColorPicker'
import SubmitButton from '@/components/SubmitButton'

type CardRow = {
  id: string
  account_id: string
  name: string
  brand: string | null
  last4: string | null
  limit_amount: number | null
  closing_day: number
  due_day: number
  institution: string | null
  color_hex: string | null
  icon_slug: string | null
  archived: boolean
}

export default async function EditCardPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para editar cartões.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  // Carrega o cartão
  const { data, error } = await supabase
    .from('cards')
    .select('id, account_id, name, brand, last4, limit_amount, closing_day, due_day, institution, color_hex, icon_slug, archived')
    .eq('user_id', user.id)
    .eq('id', params.id)
    .single()

  if (error || !data) {
    notFound()
  }
  const card = data as CardRow

  // --- wrappers de server actions para injetar o id da rota ---
  const doUpdate = async (fd: FormData) => {
    'use server'
    const { updateCard } = await import('../../actions')
    await updateCard(params.id, fd)
  }

  const doArchive = async () => {
    'use server'
    const { archiveCard } = await import('../../actions')
    await archiveCard(params.id)
    redirect('/cards')
  }
  // ------------------------------------------------------------

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Editar cartão</h1>
          <Link href="/cards" className="text-sm text-neutral-600 hover:underline">Voltar</Link>
        </div>

        <form action={doUpdate} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              name="name"
              required
              defaultValue={card.name}
              className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              placeholder="Cartão Nubank"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Bandeira</label>
              <input
                name="brand"
                defaultValue={card.brand ?? ''}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
                placeholder="Visa, Mastercard..."
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Final</label>
              <input
                name="last4"
                defaultValue={card.last4 ?? ''}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
                placeholder="1234"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Instituição</label>
              <input
                name="institution"
                defaultValue={card.institution ?? ''}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
                placeholder="Banco emissor"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Limite (R$)</label>
              <input
                name="limit_amount"
                inputMode="decimal"
                step="0.01"
                defaultValue={card.limit_amount ?? 0}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
                placeholder="ex: 5000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Dia de fechamento</label>
              <input
                name="closing_day"
                type="number"
                min={1}
                max={28}
                required
                defaultValue={card.closing_day ?? 5}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Dia de vencimento</label>
              <input
                name="due_day"
                type="number"
                min={1}
                max={28}
                required
                defaultValue={card.due_day ?? Math.min(28, (card.closing_day ?? 5) + 7)}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
                placeholder="ex: 15"
              />
            </div>
          </div>

          {/* Picker client-only para ícone/cor (escreve nos inputs hidden color_hex/icon_slug) */}
          <IconColorPicker
            defaultIconSlug={card.icon_slug ?? 'FaCreditCard'}
            defaultColorHex={card.color_hex ?? '#8b5cf6'}
            hint="Escolha um ícone e uma cor para identificar o cartão na interface."
          />

          <div className="flex items-center gap-3 pt-2">
            <SubmitButton>Salvar</SubmitButton>
            <Link href="/cards" className="px-4 py-2 border rounded-lg">Cancelar</Link>
          </div>
        </form>

        <form action={doArchive} className="pt-2">
          <button type="submit" className="text-sm text-red-600 hover:underline">
            Arquivar cartão
          </button>
        </form>
      </div>
    </main>
  )
}
