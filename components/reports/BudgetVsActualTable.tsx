// components/reports/BudgetVsActualTable.tsx
'use client'

import { formatBRL } from '@/lib/format'

export type BudgetRow = {
  category: string
  amount: number
  spent: number
  percent?: number
}

export default function BudgetVsActualTable({ rows }: { rows: BudgetRow[] }) {
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[700px] w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left border-b">
              <th className="py-3 px-4">Categoria</th>
              <th className="py-3 px-4">Planejado</th>
              <th className="py-3 px-4">Gasto</th>
              <th className="py-3 px-4">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const diff = (r.amount ?? 0) - (r.spent ?? 0)
              const positive = diff >= 0
              return (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 px-4">{r.category || '—'}</td>
                  <td className="py-3 px-4">{formatBRL(r.amount)}</td>
                  <td className="py-3 px-4">{formatBRL(r.spent)}</td>
                  <td className={`py-3 px-4 ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatBRL(diff)}
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-500">Sem dados para o período.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
