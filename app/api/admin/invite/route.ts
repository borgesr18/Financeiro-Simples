// app/api/admin/invite/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, hasAdminKey } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

async function isAdmin(userId: string | null, email: string | null) {
  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (email && allow.includes(email.toLowerCase())) return true

  if (!userId) return false
  try {
    const s = createClient()
    const { data } = await s.from('profiles').select('is_admin').eq('id', userId).maybeSingle()
    return !!data?.is_admin
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    const s = createClient()
    const { data: { user } } = await s.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ok = await isAdmin(user.id, user.email ?? null)
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (!hasAdminKey()) return NextResponse.json({ error: 'Service Role ausente' }, { status: 500 })

    const body = await req.json().catch(() => ({}))
    const email: string | undefined = body?.email
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    const admin = createAdminClient()
    const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/login`
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ user: data.user ?? null })
  } catch (err: any) {
    console.error('[api/admin/invite] error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
