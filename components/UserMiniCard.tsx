// components/UserMiniCard.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/authz'

export default async function UserMiniCard() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = user ? await isAdmin() : false

  if (!user) {
    return (
      <div className="flex items-center">
        <div className="w-9 h-9 rounded-full bg-neutral-200 mr-3" />
        <div>
          <p className="text-sm font-medium text-neutral-800">Convidado</p>
          <p className="text-xs text-neutral-500">Sem sessão</p>
        </div>
        <Link href="/login" className="ml-auto text-primary-600 hover:underline">
          Entrar
        </Link>
      </div>
    )
  }

  const name = (user.user_metadata as any)?.name ?? 'Usuário'
  const email = user.email ?? '—'
  const avatar = (user.user_metadata as any)?.avatar_url
    ?? 'https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg'

  return (
    <div className="flex items-center">
      <img
        src={avatar}
        alt="Avatar"
        className="w-9 h-9 rounded-full mr-3"
      />
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-800 truncate">{name}</p>
        <p className="text-xs text-neutral-500 truncate">{email}</p>
      </div>
      {admin && (
        <Link
          href="/settings/users"
          className="ml-auto text-xs px-2 py-1 rounded bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100"
        >
          Admin
        </Link>
      )}
    </div>
  )
}
