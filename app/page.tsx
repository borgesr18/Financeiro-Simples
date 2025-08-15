import SpendingChart from '@/components/SpendingChart'
import CategoryChart from '@/components/CategoryChart'
import { createClient } from '@/lib/supabase/server'
import { startOfMonth, endOfMonth, formatISO } from 'date-fns'

export default async function Home() {
  const supabase = createClient()
  const today = new Date()
  const from = formatISO(startOfMonth(today), { representation: 'date' })
  const to   = formatISO(endOfMonth(today),   { representation: 'date' })

  const { data: totals } = await supabase.rpc('month_totals', { from_date: from, to_date: to })

  const income  = Number(totals?.income ?? 0)
  const expense = Math.abs(Number(totals?.expense ?? 0))
  const balance = income - expense

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
      {/* Boas-vindas + ações */}
      <section className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-neutral-800">Bom dia, Rodrigo!</h2>
            <p className="text-neutral-500">Seu panorama financeiro deste mês</p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <a href="/transactions" className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 flex items-center">Ver tudo</a>
            <a href="/add" className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors flex items-center">Novo lançamento</a>
          </div>
        </div>
      </section>

      {/* Cards de resumo */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-500 text-sm font-medium">Saldo total</div>
            <div className="bg-primary-50 text-primary-500 p-2 rounded-lg">💼</div>
          </div>
          <div className="mb-1">
            <span className="text-2xl font-bold text-neutral-800">R$ {balance.toFixed(2)}</span>
          </div>
          <div className="flex items-center text-success text-sm"><span>mês atual</span></div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-500 text-sm font-medium">Entradas</div>
            <div className="bg-green-50 text-success p-2 rounded-lg">⬇</div>
          </div>
          <div className="mb-1">
            <span className="text-2xl font-bold text-neutral-800">R$ {income.toFixed(2)}</span>
          </div>
          <div className="flex items-center text-success text-sm"><span>mês atual</span></div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-500 text-sm font-medium">Saídas</div>
            <div className="bg-red-50 text-danger p-2 rounded-lg">⬆</div>
          </div>
          <div className="mb-1">
            <span className="text-2xl font-bold text-neutral-800">R$ {expense.toFixed(2)}</span>
          </div>
          <div className="flex items-center text-danger text-sm"><span>mês atual</span></div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-neutral-500 text-sm font-medium">Poupança</div>
            <div className="bg-secondary-50 text-secondary-500 p-2 rounded-lg">🐷</div>
          </div>
          <div className="mb-1">
            <span className="text-2xl font-bold text-neutral-800">—</span>
          </div>
          <div className="text-sm text-neutral-500">em breve</div>
        </div>
      </section>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">Spending Overview</h3>
              <p className="text-sm text-neutral-500">Padrões de gastos ao longo do tempo</p>
            </div>
            <div className="flex space-x-2">
              <button className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-sm font-medium">Mensal</button>
              <button className="px-3 py-1.5 bg-white text-neutral-500 rounded-lg text-sm font-medium border border-neutral-200">Semanal</button>
            </div>
          </div>
          <div className="h-[300px]">
            <SpendingChart />
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-card p-5 hover:shadow-card-hover transition-shadow">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-neutral-800">Spending by Category</h3>
              <p className="text-sm text-neutral-500">Mês atual</p>
            </div>
            <button className="text-primary-500 hover:text-primary-600">⋯</button>
          </div>
          <div className="h-[220px] mb-4">
            <CategoryChart />
          </div>
          {/* legendinha fake — pode ser trocada por dados reais */}
          <div className="grid grid-cols-2 gap-3 text-sm text-neutral-600">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-primary-400 mr-

