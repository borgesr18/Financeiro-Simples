// components/reports/BudgetVsActualTable.tsx
import { CategoryBadge } from "@/components/CategoryBadge";

export default function BudgetVsActualTable({ rows }: { rows: { category_id: string; category_name: string; budget: number; actual: number; diff: number }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[680px] w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Categoria</th>
            <th className="py-2">Orçamento</th>
            <th className="py-2">Realizado</th>
            <th className="py-2">Diferença</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.category_id} className="border-b">
              <td className="py-2"><CategoryBadge name={r.category_name} /></td>
              <td className="py-2">R$ {r.budget.toFixed(2)}</td>
              <td className="py-2">R$ {r.actual.toFixed(2)}</td>
              <td className={`py-2 ${r.diff >= 0 ? "text-emerald-600" : "text-rose-600"}`}>R$ {r.diff.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
