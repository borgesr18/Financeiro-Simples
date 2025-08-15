'use client'
import { brl } from '@/lib/format'

export default function BudgetBar({
  category,
  amount,
  spent,
  percent,
  over,
}: {
  category: string
  amount: number
  spent: number
  percent: number
  over: boolean
}) {
  const clamped = Math.min(percent, 100)
  const barColor =
    amount === 0
      ? 'bg-neutral-300'
      : over || percent >= 100
      ? 'bg-red-500'
      : percent >= 80
      ? 'bg-yellow-500'
      : 'bg-primary-500'

  return (
    <div className="p-4 rounded-xl border border-neutral-200 bg-white hover:shadow-card transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{category}</div>
        <div className="text-sm text-neutral-500">
          <span className="font-medium text-neutral-800">{brl(spent)}</span>
          {' '} / {brl(amount)}
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full ${barColor}`}
          style={{ width: `${clamped}%` }}
          aria-valuenow={Math.round(percent)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-neutral-500">
          {amount === 0 ? 'Sem meta definida' : `${Math.round(percent)}% usado`}
        </span>
        {over && (
          <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
            Ultrapassou a meta
          </span>
        )}
      </div>
    </div>
  )
}
