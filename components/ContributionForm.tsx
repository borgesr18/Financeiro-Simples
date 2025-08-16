// components/ContributionForm.tsx
import { addContribution } from '@/app/(app)/goals/actions'

export default function ContributionForm({ goalId }: { goalId: string }) {
  const today = new Date().toISOString().slice(0,10)
  return (
    <form action={addContribution} className="space-y-3">
      <input type="hidden" name="goal_id" value={goalId} />
      <div>
        <label className="block text-sm mb-1">Data</label>
        <input type="date" name="date" defaultValue={today} className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Valor do aporte (R$)</label>
        <input type="number" step="0.01" name="amount" required className="w-full rounded border px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm mb-1">Observações</label>
        <input type="text" name="notes" placeholder="opcional" className="w-full rounded border px-3 py-2" />
      </div>
      <button className="px-4 py-2 bg-sky-500 text-white rounded-lg">Adicionar aporte</button>
    </form>
  )
}
