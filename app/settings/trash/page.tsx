// app/settings/trash/page.tsx
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { hardDeleteAccountAction, restoreAccountAction, softDeleteAccountAction } from './trash-actions';

type Account = {
  id: string;
  name: string;
  type: string;
  deleted_at: string | null;
};

async function getData() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, accounts: [] as Account[] };

  // Só exemplos com contas; você pode repetir o mesmo para budgets, categories, etc.
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id,name,type,deleted_at')
    .eq('user_id', user.id)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  return { user, accounts: accounts ?? [] };
}

export default async function TrashPage() {
  const { user, accounts } = await getData();

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para acessar a Lixeira.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    );
  }

  // wrappers para server actions (Next precisa disso quando a page é server)
  const doRestore = async (fd: FormData) => { 'use server'; await restoreAccountAction(fd); };
  const doHardDelete = async (fd: FormData) => { 'use server'; await hardDeleteAccountAction(fd); };

  return (
    <main className="p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Lixeira</h1>
          <Link href="/settings" className="text-sm text-neutral-600 hover:underline">Voltar às configurações</Link>
        </header>

        {/* Contas removidas */}
        <section className="bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-medium mb-4">Contas removidas</h2>

          {accounts.length === 0 ? (
            <p className="text-sm text-neutral-500">Nenhuma conta na lixeira.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500">
                  <th className="py-2">Nome</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Removido em</th>
                  <th className="py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {accounts.map(a => (
                  <tr key={a.id}>
                    <td className="py-2">{a.name}</td>
                    <td className="py-2">{a.type}</td>
                    <td className="py-2">{a.deleted_at ? new Date(a.deleted_at).toLocaleString('pt-BR') : '—'}</td>
                    <td className="py-2 text-right">
                      <form action={doRestore} className="inline-block mr-2">
                        <input type="hidden" name="id" value={a.id} />
                        <button className="px-3 py-1 border rounded-lg hover:bg-neutral-50">Restaurar</button>
                      </form>

                      {/* Hard delete com opções */}
                      <details className="inline-block">
                        <summary className="px-3 py-1 border rounded-lg hover:bg-neutral-50 cursor-pointer inline-flex">
                          Excluir…
                        </summary>
                        <div className="mt-2 p-3 border rounded-lg bg-neutral-50">
                          <form action={doHardDelete} className="space-y-2">
                            <input type="hidden" name="id" value={a.id} />

                            <label className="block text-xs text-neutral-600">Modo</label>
                            <select name="mode" className="w-full border rounded-lg px-2 py-1">
                              <option value="if-empty">Excluir se não tiver lançamentos</option>
                              <option value="move">Mover lançamentos para outra conta e excluir</option>
                              <option value="purge">Apagar lançamentos e conta (irreversível)</option>
                            </select>

                            <label className="block text-xs text-neutral-600">Conta destino (para “Mover”)</label>
                            <input name="target_account_id" placeholder="UUID da conta destino" className="w-full border rounded-lg px-2 py-1" />

                            <button className="w-full bg-red-600 text-white rounded-lg px-3 py-2">Excluir permanentemente</button>
                          </form>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Você pode replicar seções semelhantes para Budgets, Categorias, Metas, Transações */}
      </div>
    </main>
  );
}
