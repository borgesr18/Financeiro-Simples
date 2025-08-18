// app/api/admin/users/route.ts
export const runtime = 'nodejs'

import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, hasAdminKey } from '@/lib/supabase/admin'

async function isAdmin(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const allow = (process.env.ADMIN_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
  if (user.email && allow.includes(user.email.toLowerCase())) return true

  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle()
    return !!data?.is_admin
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  try {
    if (!hasAdminKey()) {
      return NextResponse.json({ error: 'Service key missing' }, { status: 503 })
    }
    if (!(await isAdmin(req))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = createAdminClient()

    // Lista até 200 usuários (ajuste se quiser paginação)
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    if (error) throw error

    const users = (data?.users ?? []).map(u => ({
      id: u.id,
      email: u.email ?? null,
      created_at: u.created_at ?? null,
      banned_until: (u as any).banned_until ?? null, // campo retornado pelo GoTrue
    }))

    // Junta com profiles.is_admin
    const ids = users.map(u => u.id)
    let isAdminMap: Record<string, boolean> = {}
    if (ids.length) {
      const { data: profiles } = await admin
        .from('profiles')
        .select('id, is_admin')
        .in('id', ids)

      for (const p of (profiles ?? [])) {
        isAdminMap[p.id] = !!p.is_admin
      }
    }

    const out = users.map(u => ({
      ...u,
      is_admin: !!isAdminMap[u.id],
    }))

    return NextResponse.json({ users: out })
  } catch (err: any) {
    console.error('[api/admin/users] fail:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

