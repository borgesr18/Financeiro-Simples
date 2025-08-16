// app/(app)/reports/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from "@/lib/supabase/server";
import MonthlyChart from "@/components/charts/MonthlyChart";
import BudgetVsActualTable from "@/components/reports/BudgetVsActualTable";

type TxRow = {
  occurred_at: string; // vem como occurred_at:date no select
  amount: number;
  type: 'income' | 'expense';
};

type BudgetRelCat =
  | { id: string; name: string }
  | { id: string; name: string }[]
  | null
  | undefined;

type BudgetRow = {
  id: string;
  amount: number; // <- usa coluna real
  categories?: BudgetRelCat;
};

function pickCat(cat: BudgetRelCat): { id?: string; name?: string } {
  if (!cat) return {}
  return Array.isArray(cat) ? (cat[0] ?? {}) : cat
}

export default async function ReportsPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para ver os relatórios.</p>
        </div>
      </main>
    );
  }

  const month = (searchParams?.["month"] as string) ?? new Date().toISOString().slice(0, 7);

  // Intervalo 12 meses
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const from = start.toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  // Fluxo Mensal (sem RPC)
  let monthly: { month: string; income: number; expense: number; balance: number }[] = [];
  {
    const { data: txs } = await supabase
      .from("transactions")
      .select("occurred_at:date, amount, type")
      .gte("date", from)
      .lte("date", to)
      .eq("user_id", user.id);

    const map = new Map<string, { income: number; expense: number }>();
    for (const t of (txs ?? []) as TxRow[]) {
      const d = new Date(t.occurred_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cur = map.get(key) ?? { income: 0, expense: 0 };
      if (t.type === "income") cur.income += Number(t.amount || 0);
      if (t.type === "expense") cur.expense += Math.abs(Number(t.amount || 0));
      map.set(key, cur);
    }
    monthly = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, v]) => ({ month: m, income: v.income, expense: v.expense, balance: v.income - v.expense }));
  }

  // BvA do mês
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const monthStart = `${y}-${String(m).padStart(2, "0")}-01`;
  const monthEnd = new Date(y, m, 0).toISOString().slice(0, 10);

  const { data: budgetsRaw } = await supabase
    .from("budgets")
    .select("id, amount, categories:category_id(id, name)")
    .eq("year", y)
    .eq("month", m)
    .eq("user_id", user.id);

  const budgets = (budgetsRaw ?? []) as BudgetRow[];

  const { data: txMonth } = await supabase
    .from("transactions")
    .select("category_id, amount, type")
    .gte("date", monthStart)
    .lte("date", monthEnd)
    .eq("user_id", user.id);

  const spentByCat = new Map<string, number>();
  for (const t of txMonth ?? []) {
    if (t.type === "expense" && t.category_id) {
      spentByCat.set(t.category_id, (spentByCat.get(t.category_id) ?? 0) + Math.abs(Number(t.amount || 0)));
    }
  }

  const bvaRows = budgets.map((b) => {
    const cat = pickCat(b.categories);
    const catId = cat.id ?? "";
    const spent = spentByCat.get(catId) ?? 0;
    const planned = Number(b.amount) || 0;
    return {
      category_id: catId || b.id,
      category_name: cat.name ?? "—",
      budget: planned,
      actual: spent,
      diff: planned - spent,
    };
  });

  for (const [catId, spent] of spentByCat) {
    const has = budgets.some((b) => {
      const cat = pickCat(b.categories);
      return cat.id === catId;
    });
    if (!has) {
      bvaRows.push({
        category_id: catId,
        category_name: "Sem orçamento",
        budget: 0,
        actual: spent,
        diff: -spent,
      });
    }
  }

  return (
    <main className="p-6">
      <div className="space-y-6 max-w-5xl mx-auto">
        <section>
          <h2 className="text-lg font-semibold">Fluxo Mensal (12 meses)</h2>
          <MonthlyChart data={monthly} />
        </section>

        <section>
          <h2 className="text-lg font-semibold">Orçamento vs Realizado — {month}</h2>
          <BudgetVsActualTable rows={bvaRows} />
        </section>
      </div>
    </main>
  );
}

