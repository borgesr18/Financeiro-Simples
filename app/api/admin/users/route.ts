// app/api/admin/users/route.ts
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

export async function GET() {
  try {
    const s = createClient()
    const { data: { user } } = await s.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const ok = await isAdmin(user.id, user.email ?? null)
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    if (!hasAdminKey()) return NextResponse.json({ users: [] })

    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.listUsers()
    if (error) throw error

    const users = data?.users ?? []
    const ids = users.map(u => u.id)

    let flags: Record<string, boolean> = {}
    if (ids.length) {
      const { data: profs } = await admin.from('profiles').select('id,is_admin').in('id', ids)
      for (const p of (profs ?? [])) flags[p.id] = !!p.is_admin
    }

    const out = users.map(u => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at ?? null,
      is_admin: flags[u.id] ?? false,
    }))
    return NextResponse.json({ users: out })
  } catch (err: any) {
    console.error('[api/admin/users] error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
