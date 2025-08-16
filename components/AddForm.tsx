'use client'

import { useFormState } from 'react-dom'
import { createTransaction } from '@/app/add/actions'

type Category = { id: string; name: string }
type Account  = { id: string; name: string }

function FieldError({ error }: { error?: string | null }) {
  if (!error) return null
  return <p className="text-xs text-red-600 mt-1">{error}</p>
}

type Props = {
  categories: Category[]
  accounts: Account[]
}

type State = { error?: string | null }

export default function AddForm({ categories, accounts }: Props) {
  const [state, formAction] = useFormState<State, FormData>(async (_state, fd) => {
    try {
      await createTransaction(fd)
      return { error: null }
    } catch (e: any) {
      return { error: e?.message ?? 'Falha ao salvar' }
    }
  }, { error: null })

  return (
    <form action={formAction} className="space-y-3">
      {state.error && (
        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">{state.error}</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Data</label>
          <input name="date" type="date" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50" />
        </div>
        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <select name="type" className="w-full px-3 py-2 border rounded-lg bg-neutral-50">
            <option value="out">Saída</option>
            <option value="in">Entrada</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Conta</label>
        <select name="account_id" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50">
          {accounts.length === 0 && <option value="" disabled>— Crie uma conta —</option>}
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Categoria</label>
        <select name="category_id" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50">
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Valor</label>
          <input
            name="amount"
            inputMode="decimal"
            placeholder="Ex: 1.234,56"
            required
            className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
          />
          <FieldError error={undefined} />
        </div>
        <div>
          <label className="block text-sm mb-1">Descrição</label>
          <input name="description" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">Salvar</button>
      </div>
    </form>
  )
}
