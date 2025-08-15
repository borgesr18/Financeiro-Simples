import SpendingChart from '@/components/SpendingChart'
import CategoryChart from '@/components/CategoryChart'
import { createClient } from '@/lib/supabase/server'
import { getMonthlyMetrics } from '@/lib/metrics'
import { brl } from '@/lib/format'
import Link from 'next/link'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Sem login: CTA para entrar
  if (!user) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Bem-vindo ao Financeiro Simples</h1>
          <p className="text-neutral-600 mb-4">Faça login para ver seus dados.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Entrar
          </Link>
        </div>
      </main>
    )
  }

  const metrics = await getMonthlyMetrics(supabase)

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
      {/* Cards resumo */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="text-neutral-500 text-sm mb-2">Saldo</div>
          <div className={`text-2xl font-bold ${metrics.balance >= 0 ? 'text-neutral-800' : 'text-danger'}`}>{brl(metrics.balance)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="text-neutral-500 text-sm mb-2">Entradas</div>
          <div className="text-2xl font-bold text-success">{brl(metrics.income)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="text-neutral-500 text-sm mb-2">Saídas</div>
          <div className="text-2xl font-bold text-danger">{brl(metrics.expense)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="text-neutral-500 text-sm mb-2">Ações rápidas</div>
          <Link href="/add" className="inline-block px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600">
            Novo lançamento
          </Link>
        </div>
      </section>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spending Overview */}
        <section className="bg-white rounded-xl shadow-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">Spending Overview (mês)</h3>
              <p className="text-sm text-neutral-500">Entradas vs Saídas por dia</p>
            </div>
          </div>
          <div className="h-[300px]">
            <SpendingChart
              categories={metrics.series.categories}
              income={metrics.series.income}
              expense={metrics.series.expense}
            />
          </div>
        </section>

        {/* Pizza por categoria (Saídas) */}
        <section className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">Gasto por Categoria</h3>
              <p className="text-sm text-neutral-500">Somente saídas do mês</p>
            </div>
          </div>
          <div className="h-[240px]">
            <CategoryChart data={metrics.byCategory} />
          </div>
        </section>
      </div>
    </main>
  )
}

