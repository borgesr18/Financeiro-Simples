// components/BudgetBar.tsx
type Props = {
  amount: number
  spent: number
  percent?: number
  over?: boolean
  category?: string
}

export default function BudgetBar({ amount, spent, percent, over }: Props) {
  const pct = typeof percent === 'number'
    ? Math.max(0, Math.min(999, Math.round(percent)))
    : amount > 0
      ? Math.max(0, Math.min(999, Math.round((spent / amount) * 100)))
      : 0

  const barClass = over ? 'bg-red-500' : 'bg-primary-500'

  return (
    <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden my-2">
      <div className={`h-full ${barClass} rounded-full`} style={{ width: `${Math.min(100, pct)}%` }} />
    </div>
  )
}
