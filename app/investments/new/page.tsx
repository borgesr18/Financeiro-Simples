// app/investments/new/page.tsx
import { createClient } from '@/lib/supabase/server'
import { getAssets, getInvestmentAccounts } from '@/lib/investments'
import { createTrade, createAsset } from '../actions'

export const dynamic = 'force-dynamic'

export default async function NewTradePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para lançar operações.</p>
          <a href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</a>
        </div>
      </main>
    )
  }

  const [assets, accounts] = await Promise.all([
    getAssets(),
    getInvestmentAccounts(),
  ])

  return (
    <main className="p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-4">Novo movimento</h2>
          <form action={createTrade} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-1">Data</label>
                <input name="date" type="date" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50" />
              </div>
              <div>
                <label className="block text-sm mb-1">Tipo</label>
                <select name="side" className="w-full px-3 py-2 border rounded-lg bg-neutral-50">
                  <option value="buy">Compra</option>
                  <option value="sell">Venda</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Conta (investimentos)</label>
              <select name="account_id" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50">
                {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {accounts.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Você ainda não tem conta de investimentos. Crie uma em <a className="underline" href="/banking">Bancos</a>.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Ativo</label>
              <select name="asset_id" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50">
                {assets.map((as: any) => (
                  <option key={as.id} value={as.id}>{as.ticker} — {as.name}</option>
                ))}
              </select>
              {assets.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nenhum ativo cadastrado. Use o formulário abaixo para cadastrar e depois lance a operação.
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm mb-1">Quantidade</label>
                <input name="quantity" inputMode="decimal" step="0.000001" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50" />
              </div>
              <div>
                <label className="block text-sm mb-1">Preço</label>
                <input name="price" inputMode="decimal" step="0.0001" required className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="Ex: 12,34" />
              </div>
              <div>
                <label className="block text-sm mb-1">Taxas</label>
                <input name="fees" inputMode="decimal" step="0.01" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" placeholder="0,00" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Observações</label>
              <textarea name="notes" rows={3} className="w-full px-3 py-2 border rounded-lg bg-neutral-50" />
            </div>

            <div className="flex justify-end">
              <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">
                Salvar
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-base font-semibold mb-3">Cadastrar novo ativo</h3>
          <form action={createAsset} className="grid grid-cols-2 gap-3">
            <div className="col-span-1">
              <label className="block text-sm mb-1">Ticker</label>
              <input name="ticker" placeholder="PETR4" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" required />
            </div>
            <div className="col-span-1">
              <label className="block text-sm mb-1">Classe</label>
              <select name="class" className="w-full px-3 py-2 border rounded-lg bg-neutral-50">
                <option value="stock">Ação</option>
                <option value="reit">FII</option>
                <option value="etf">ETF</option>
                <option value="crypto">Cripto</option>
                <option value="fund">Fundo</option>
                <option value="bond">Renda fixa</option>
                <option value="other">Outro</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm mb-1">Nome</label>
              <input name="name" placeholder="Petrobras PN" className="w-full px-3 py-2 border rounded-lg bg-neutral-50" />
            </div>
            <div className="col-span-2 flex justify-end">
              <button className="px-4 py-2 bg-neutral-800 text-white rounded-lg">Salvar ativo</button>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
