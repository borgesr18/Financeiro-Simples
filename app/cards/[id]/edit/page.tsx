export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateCard } from '../../actions'
import IconColorPicker from '@/components/IconColorPicker'

export default async function EditCardPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para editar cartões.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  const { data } = await supabase
    .from('cards')
    .select('id, name, brand, last4, institution, limit_amount, closing_day, due_day, color_hex, icon_slug, archived')
    .eq('user_id', user.id)
    .eq('id', params.id)
    .single()

  if (!data) return notFound()

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-5">
        <h1 className="text-xl font-semibold">Editar cartão</h1>

        <form action={(fd) => updateCard(params.id, fd)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              name="name"
              defaultValue={data.name ?? ''}
              required
              className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Bandeira</label>
              <input
                name="brand"
                defaultValue={data.brand ?? ''}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Final</label>
              <input
                name="last4"
                defaultValue={data.last4 ?? ''}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Instituição</label>
              <input
                name="institution"
                defaultValue={data.institution ?? ''}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Limite (R$)</label>
              <input
                name="limit_amount"
                type="number"
                step="0.01"
                defaultValue={Number(data.limit_amount ?? 0)}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
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
                defaultValue={data.closing_day ?? 5}
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
                defaultValue={data.due_day ?? 15}
                className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              />
            </div>
          </div>

          {/* 🔥 Picker client-only com valores atuais */}
          <IconColorPicker
            defaultIconSlug={data.icon_slug ?? 'FaCreditCard'}
            defaultColorHex={data.color_hex ?? '#6b7280'}
            hint="Altere o ícone e a cor para personalizar este cartão."
          />

          <label className="inline-flex items-center gap-2 pt-1">
            <input type="checkbox" name="archived" defaultChecked={!!data.archived} />
            <span className="text-sm">Arquivado</span>
          </label>

          <div className="pt-2 flex items-center gap-2">
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">Salvar</button>
            <Link href="/cards" className="px-4 py-2 border rounded-lg">Cancelar</Link>
          </div>
        </form>
      </div>
    </main>
  )
}
