// app/budget/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server";
import { getBudgetsWithSpend, type BudgetLine } from "@/lib/budgets";
import BudgetForm from "@/components/BudgetForm";

export default async function BudgetPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar orçamentos.</p>
        </div>
      </main>
    );
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  let lines: BudgetLine[] = [];
  let errorMsg: string | null = null;

  try {
    lines = await getBudgetsWithSpend(year, month);
  } catch (e: any) {
    console.error("[BudgetPage] Falha em getBudgetsWithSpend:", e);
    errorMsg = typeof e?.message === "string" ? e.message : "Erro ao carregar orçamentos.";
  }

  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, name")
    .eq("user_id", user.id)
    .order("name");

  if (catErr) {
    console.error("[BudgetPage] Falha ao carregar categorias:", catErr);
  }

  return (
    <main className="p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-6">
        <h2 className="text-xl font-semibold">Orçamentos</h2>

        {errorMsg && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium mb-1">Não foi possível carregar Orçamentos</p>
            <p>{errorMsg}</p>
          </div>
        )}

        <BudgetForm categories={categories ?? []} />

        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Categoria</th>
                <th className="py-2">Planejado</th>
                <th className="py-2">Gasto</th>
                <th className="py-2">Diferença</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="py-2">{l.category}</td>
                  <td className="py-2">R$ {l.amount.toFixed(2)}</td>
                  <td className="py-2">R$ {l.spent.toFixed(2)}</td>
                  <td className={`py-2 ${l.over ? "text-rose-600" : "text-emerald-600"}`}>
                    R$ {(l.amount - l.spent).toFixed(2)}
                  </td>
                </tr>
              ))}
              {lines.length === 0 && !errorMsg && (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-neutral-500">
                    Nenhum orçamento cadastrado para o mês atual.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}


