// app/settings/users/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { hasAdminKey, createAdminClient } from '@/lib/supabase/admin'

type AdminUser = {
  id: string
  email: string | null
  created_at: string | null
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Checagem de admin: por ENV (ADMIN_EMAILS) ou profiles.is_admin = true
async function isAdmin(userId: string | null, email: string | null) {
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

  if (email && allow.includes(email.toLowerCase())) return true

  try {
    if (!userId) return false
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()
    if (!error && data?.is_admin === true) return true
  } catch {
    // se não existir a tabela, a checagem por ENV cobre
  }
  return false
}

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await isAdmin(user.id, user.email ?? null)

  // >>> ajuste: não redireciona; mostra tela de acesso restrito
  if (!admin) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
          <p className="text-sm text-neutral-600">
            Sua conta não tem permissão para ver esta página.
          </p>
          <p className="text-sm text-neutral-600 mt-2">
            Peça para um administrador adicionar seu e-mail em <code>ADMIN_EMAILS</code> ou marcar{' '}
            <code>profiles.is_admin = true</code>.
          </p>
        </div>
      </main>
    )
  }

  // Se a Service Role não estiver configurada, evita erro e orienta
  if (!hasAdminKey()) {
    return (
      <main className="p-6 space-y-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Usuários</h1>
          <p className="text-sm text-neutral-600">
            A variável <code>SUPABASE_SERVICE_ROLE_KEY</code> não está configurada neste ambiente.
          </p>
          <p className="text-sm text-neutral-600">
            Defina-a nas variáveis de ambiente (apenas no servidor) para listar e administrar usuários.
          </p>
        </div>
      </main>
    )
  }

  // Lista usuários direto com o client admin (server-only)
  try {
    const adminClient = createAdminClient()
    const { data, error } = await adminClient.auth.admin.listUsers()
    if (error) throw error

    const users: AdminUser[] = (data?.users ?? []).map((u: any) => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at ?? null,
    }))

    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <Link href="/settings" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">
            Voltar
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead className="bg-neutral-50 border-b">
                <tr className="text-left">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Criado em</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-3 px-4 font-mono text-xs">{u.id}</td>
                    <td className="py-3 px-4">{u.email ?? '—'}</td>
                    <td className="py-3 px-4">
                      {u.created_at ? new Date(u.created_at).toLocaleString('pt-BR') : '—'}
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-neutral-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    )
  } catch (err) {
    console.error('[users/page] render error:', err)
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Usuários</h1>
          <p className="text-sm text-rose-600">
            Ocorreu um erro ao carregar os usuários. Veja os logs do servidor.
          </p>
        </div>
      </main>
    )
  }
}
