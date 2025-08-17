// app/settings/users/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/authz'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { inviteUser, promoteToAdmin, demoteToUser, deleteUser } from './actions'

type AdminUser = {
  id: string
  email: string | null
  created_at: string
  email_confirmed_at: string | null
  app_metadata?: Record<string, any>
  user_metadata?: Record<string, any>
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createAdminClient(url, service, { auth: { persistSession: false } })
}

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!(await isAdmin())) redirect('/')

  const a = admin()
  const { data, error } = await a.auth.admin.listUsers()
  if (error) throw error

  const users: AdminUser[] = data?.users ?? []

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuários</h1>
      </div>

      <section className="bg-white rounded-xl shadow-card p-4">
        <h2 className="text-lg font-medium mb-3">Convidar usuário</h2>
        <form action={inviteUser} className="flex gap-2">
          <input
            type="email"
            name="email"
            required
            placeholder="email@exemplo.com"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Enviar convite
          </button>
        </form>
        <p className="text-xs text-neutral-500 mt-2">
          O convidado receberá um link por e-mail para criar a senha.
        </p>
      </section>

      <section className="bg-white rounded-xl shadow-card overflow-x-auto">
        <table className="min-w-[880px] w-full text-sm">
          <thead className="bg-neutral-50">
            <tr className="text-left border-b">
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Criado em</th>
              <th className="py-3 px-4">Confirmado</th>
              <th className="py-3 px-4">Papel</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const role =
                (u.app_metadata as any)?.role ??
                (u.user_metadata as any)?.role ??
                'user'
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-3 px-4">{u.email ?? '—'}</td>
                  <td className="py-3 px-4">{new Date(u.created_at).toLocaleString('pt-BR')}</td>
                  <td className="py-3 px-4">
                    {u.email_confirmed_at
                      ? new Date(u.email_confirmed_at).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                  <td className="py-3 px-4">{role}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-2">
                      {role !== 'admin' ? (
                        <form action={promoteToAdmin}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                            Tornar admin
                          </button>
                        </form>
                      ) : (
                        <form action={demoteToUser}>
                          <input type="hidden" name="id" value={u.id} />
                          <button className="px-3 py-1.5 rounded-lg border hover:bg-neutral-50">
                            Remover admin
                          </button>
                        </form>
                      )}
                      <form action={deleteUser}>
                        <input type="hidden" name="id" value={u.id} />
                        <button className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50">
                          Excluir
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              )
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-neutral-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </main>
  )
}
