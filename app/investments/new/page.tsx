// app/investments/new/page.tsx
import Link from 'next/link'
import { createInvestment } from '../actions'

const TYPES = [
  { value: 'stock', label: 'Ação' },
  { value: 'fund', label: 'Fundo' },
  { value: 'crypto', label: 'Cripto' },
  { value: 'fixed_income', label: 'Renda fixa' },
  { value: 'real_estate', label: 'Imobiliário' },
  { value: 'other', label: 'Outro' },
]

export default function NewInvestmentPage() {
  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-6">
        <h1 className="text-xl font-semibold">Novo investimento</h1>

        <form action={createInvestment} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Nome</label>
            <input name="name" className="w-full border rounded-lg px-3 py-2" />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <select name="type" defaultValue="other" className="w-full border rounded-lg px-3 py-2">
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm mb-1">Instituição</label>
              <input name="institution" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Moeda</label>
              <input name="currency" defaultValue="BRL" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Cor (hex)</label>
              <input name="color_hex" placeholder="#10b981" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm mb-1">Ícone (slug)</label>
              <input name="icon_slug" placeholder="trending-up" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Anotações</label>
            <textarea name="notes" rows={4} className="w-full border rounded-lg px-3 py-2" />
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

