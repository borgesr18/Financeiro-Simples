// app/settings/users/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { hasAdminKey } from '@/lib/supabase/admin'
import InviteUserForm from '@/components/admin/InviteUserForm'
import { AdminToggleButton } from '@/components/admin/AdminToggleButton'

type AdminUser = {
  id: string
  email: string | null
  created_at: string | null
  is_admin: boolean
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function isAdmin(userId: string | null, email: string | null) {
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (email && allow.includes(email.toLowerCase())) return true

  try {
    if (!userId) return false
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()
    return !!data?.is_admin
  } catch {
    return false
  }
}

function getBaseUrlFromRequest(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (envUrl) return envUrl
  const h = headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

export default async function UsersPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = await isAdmin(user.id, user.email ?? null)
  if (!admin) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Acesso restrito</h1>
          <p className="text-sm text-neutral-600">
            Sua conta não tem permissão para ver esta página.
          </p>
          <p className="text-sm text-neutral-600 mt-2">
            Peça para um administrador adicionar seu e-mail em <code>ADMIN_EMAILS</code> ou marcar <code>profiles.is_admin = true</code>.
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

  if (!hasAdminKey()) {
    return (
      <main className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <Link href="/settings" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">
            Voltar
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-card p-4">
          <p className="text-sm text-neutral-600">
            Para listar/convidar usuários, defina <code>SUPABASE_SERVICE_ROLE_KEY</code> nas variáveis de ambiente.
          </p>
        </div>
      </main>
    )
  }

  // >>> Correção principal: encaminhar cookies para a API interna <<<
  let users: AdminUser[] = []
  try {
    const base = getBaseUrlFromRequest()
    const h = headers()
    const cookie = h.get('cookie') ?? ''

    const res = await fetch(`${base}/api/admin/users`, {
      cache: 'no-store',
      // cookies não são enviados automaticamente com URL absoluta;
      // então repassamos manualmente:
      headers: { cookie },
    })

    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      console.error('[users/page] api error:', j)
      throw new Error(j?.error ?? 'Falha ao carregar usuários')
    }

    const data = await res.json()
    users = (data?.users ?? []) as AdminUser[]
  } catch (err) {
    console.error('[users/page] render error:', err)
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h1 className="text-xl font-semibold mb-2">Usuários</h1>
          <p className="text-sm text-rose-600">
            Ocorreu um erro ao carregar os usuários. Veja os logs do servidor.
          </p>
          <div className="mt-4">
            <Link href="/settings" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">
              Voltar
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <Link href="/settings" className="px-3 py-2 rounded-lg border hover:bg-neutral-50">
          Voltar
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4">
        <InviteUserForm />
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[840px] w-full text-sm">
            <thead className="bg-neutral-50 border-b">
              <tr className="text-left">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Criado em</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4 text-right">Ações</th>
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
                  <td className="py-3 px-4">{u.is_admin ? 'Sim' : 'Não'}</td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      <AdminToggleButton userId={u.id} isAdmin={u.is_admin} />
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-neutral-500">
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
}

