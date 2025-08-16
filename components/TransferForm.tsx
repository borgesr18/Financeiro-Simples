// components/TransferForm.tsx
import { createClient } from '@/lib/supabase/server'
import { createTransfer } from '@/app/(app)/banking/actions'

export default async function TransferForm() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at')

  const today = new Date().toISOString().slice(0,10)

  return (
    <form action={createTransfer} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">De</label>
          <select name="from_id" className="w-full rounded border px-3 py-2" required>
            <option value="">Selecione...</option>
            {(accounts ?? []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1">Para</label>
          <select name="to_id" className="w-full rounded border px-3 py-2" required>
            <option value="">Selecione...</option>
            {(accounts ?? []).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Valor</label>
          <input type="number" step="0.01" name="amount" className="w-full rounded border px-3 py-2" required />
        </div>
        <div>
          <label className="block text-sm mb-1">Data</label>
          <input type="date" name="date" defaultValue={today} className="w-full rounded border px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">Observações</label>
        <input type="text" name="notes" placeholder="opcional" className="w-full rounded border px-3 py-2" />
      </div>
      <button className="px-4 py-2 bg-sky-500 text-white rounded-lg">Transferir</button>
    </form>
  )
}
