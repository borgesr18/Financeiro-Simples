import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { updateInvestment } from '../../actions'
import { AccountIcon } from '@/components/account-icons'

type Investment = {
  id: string
  name: string
  type: string
  institution: string | null
  currency: string
  color_hex: string | null
  icon_slug: string | null
  notes: string | null
}

const TYPES = [
  { value: 'stock', label: 'Ação' },
  { value: 'fund', label: 'Fundo' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'fixed_income', label: 'Renda fixa' },
  { value: 'real_estate', label: 'Imobiliário' },
  { value: 'other', label: 'Outro' },
]

export default async function EditInvestmentPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  const { data, error } = await supabase
    .from('investments')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) notFound()

  const inv = data as Investment

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl border flex items-center justify-center shrink-0"
            style={{ backgroundColor: inv.color_hex ?? '#e5e7eb', borderColor: 'rgba(0,0,0,0.08)' }}
          >
            <AccountIcon slug={inv.icon_slug} className="text-[18px]" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Editar investimento</h1>
            <p className="text-sm text-neutral-500">{inv.name}</p>
          </div>
        </div>

        <form action={updateInvestment} className="space-y-4">
          <input type="hidden" name="id" value={inv.id} />

          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input
              name="name"
              defaultValue={inv.name}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <select name="type" defaultValue={inv.type} className="w-full border rounded-lg px-3 py-2">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Instituição</label>
              <input
                name="institution"
                defaultValue={inv.institution ?? ''}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Moeda</label>
              <input name="currency" defaultValue={inv.currency ?? 'BRL'} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Cor (hex)</label>
              <input name="color_hex" defaultValue={inv.color_hex ?? ''} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Ícone (slug)</label>
              <input name="icon_slug" defaultValue={inv.icon_slug ?? ''} className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Anotações</label>
            <textarea name="notes" defaultValue={inv.notes ?? ''} rows={4} className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Link href="/investments" className="px-3 py-2 border rounded-lg hover:bg-neutral-50">Cancelar</Link>
            <button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">Salvar</button>
          </div>
        </form>
      </div>
    </main>
  )
}
