// app/(app)/reports/page.tsx (trecho)
import { createServerClient } from "@/lib/supabase/server";
import MonthlyChart from "@/components/charts/MonthlyChart";
import BudgetVsActualTable from "@/components/reports/BudgetVsActualTable";

export default async function ReportsPage({ searchParams }: { searchParams: any }) {
  const supabase = createServerClient();
  const month = (searchParams?.month as string) ?? new Date().toISOString().slice(0,7); // YYYY-MM

  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id!;
  const from = new Date(new Date().setMonth(new Date().getMonth() - 11)).toISOString().slice(0,10);
  const to = new Date().toISOString().slice(0,10);

  const { data: monthly } = await supabase.rpc("fn_monthly_totals", { p_user: userId, p_from: from, p_to: to });
  const { data: bva }     = await supabase.rpc("fn_budget_vs_actual", { p_user: userId, p_month: month });

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-lg font-semibold">Fluxo Mensal (12 meses)</h2>
        <MonthlyChart data={monthly ?? []} />
      </section>

      <section>
        <h2 className="text-lg font-semibold">Orçamento vs Realizado — {month}</h2>
        <BudgetVsActualTable rows={bva ?? []} />
      </section>
    </div>
  );
}
