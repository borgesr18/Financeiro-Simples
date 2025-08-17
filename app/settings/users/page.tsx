// app/settings/users/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type AdminUser = {
  id: string
  email?: string | null
  role?: string | null
  created_at: string
  last_sign_in_at?: string | null
  confirmed_at?: string | null
  banned_until?: string | null
  app_metadata?: Record<string, any> | null
  user_metadata?: Record<string, any> | null
}

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Validação de admin (tabela user_roles com { user_id, role })
  const { data: roleRow, error: roleErr } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()

  if (roleErr || !roleRow || roleRow.role !== 'admin') {
    redirect('/') // não-admins voltam para o painel
  }

  // Busca via rota interna que usa Service Role
  const res = await fetch('/api/admin/users', { cache: 'no-store' })
  if (!res.ok) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-lg font-semibold mb-2">Usuários</h1>
          <p className="text-sm text-rose-600">Falha ao carregar a lista de usuários.</p>
        </div>
      </main>
    )
  }

  const payload = (await res.json()) as { users?: any[] }
  const users: AdminUser[] = (payload.users ?? []).map((u: any) => ({
    id: u.id,
    email: u.email ?? null,                 // <- compatível com undefined/null
    role: u.role ?? null,
    created_at: u.created_at ?? '',
    last_sign_in_at: u.last_sign_in_at ?? null,
    confirmed_at: u.confirmed_at ?? null,
    banned_until: u.banned_until ?? null,
    app_metadata: u.app_metadata ?? null,
    user_metadata: u.user_metadata ?? null,
  }))

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <Link
          href="/settings/users/new"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Novo usuário
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-x-auto">
        <table className="min-w-[760px] w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left border-b">
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Função</th>
              <th className="py-3 px-4">Último acesso</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-3 px-4">{u.email ?? '—'}</td>
                <td className="py-3 px-4">{u.role ?? 'user'}</td>
                <td className="py-3 px-4">
                  {u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleString('pt-BR')
                    : '—'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/settings/users/${u.id}`}
                      className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50"
                    >
                      Gerenciar
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-neutral-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}
