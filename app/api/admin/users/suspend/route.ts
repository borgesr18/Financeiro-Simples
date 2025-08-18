// app/api/admin/users/suspend/route.ts
export const runtime = 'nodejs'

import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient, hasAdminKey } from '@/lib/supabase/admin'

async function isAdmin() {
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

export async function POST(req: NextRequest) {
  try {
    if (!hasAdminKey()) {
      return NextResponse.json({ error: 'Service key missing' }, { status: 503 })
    }
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, suspend } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Estratégia: usar o campo banned_until
    const payload =
      suspend
        ? { banned_until: new Date('2999-01-01').toISOString() }
        : { banned_until: null }

    const { data, error } = await admin.auth.admin.updateUserById(userId, payload as any)
    if (error) throw error

    return NextResponse.json({
      ok: true,
      user: {
        id: data.user?.id ?? userId,
        banned_until: (data.user as any)?.banned_until ?? payload.banned_until ?? null,
      },
    })
  } catch (err: any) {
    console.error('[api/admin/users/suspend] fail:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
