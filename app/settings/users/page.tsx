// app/settings/users/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { hasAdminKey, getAdminClient } from '@/lib/supabase/admin'

type AdminUser = {
  id: string
  email: string | null
  created_at: string | null
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function resolveIsAdmin(userId: string, email: string | null) {
  // 1) Lista branca por e-mail (env ADMIN_EMAILS)
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (email && allow.includes(email.toLowerCase())) return true

  // 2) Se houver Service Role, consulta direto (sem RLS)
  if (hasAdminKey()) {
    try {
      const admin = getAdminClient()
      const { data, error } = await admin
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .maybeSingle()
      if (!error && data?.is_admin === true) return true
      if (error) console.error('[users/page] admin check via service role:', error)
    } catch (e) {
      console.error('[users/page] admin check (service) ex:', e)
    }
  }

  // 3) Fallback via client com RLS (deve conseguir ler o próprio perfil)
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()
    if (!error && data?.is_admin === true) return true
    if (error) console.error('[users/page] admin check via RLS:', error)
  } catch (e) {
    console.error('[users/page] admin check (rls) ex:', e)
  }

  return false
}

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const isAdmin = await resolveIsAdmin(user!.id, user!.email ?? null)

  // Não é admin → mostra página amigável (sem redirecionar)
  if (!isAdmin) {
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
          <div className="mt-4">
            <Link href="/" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">
              Voltar ao painel
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Se não tiver Service Role configurada, mostra aviso (continua sem quebrar)
  if (!hasAdminKey()) {
    return (
      <main className="p-6 space-y-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Usuários</h1>
          <p className="text-sm text-neutral-600">
            A variável <code>SUPABASE_SERVICE_ROLE_KEY</code> não está configurada neste ambiente.
            Sem ela, a listagem/gerência de usuários fica desabilitada.
          </p>
        </div>
      </main>
    )
  }

  // Busca a lista via API admin
  try {
    const base = process.env.NEXT_PUBLIC_SITE_URL
    const url = base ? `${base}/api/admin/users` : '/api/admin/users'
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      console.error('[users/page] api error:', j)
      throw new Error(j?.error ?? 'Falha ao carregar usuários')
    }

    const data = await res.json()
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
                {users.map(u => (
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
