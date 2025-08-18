// app/api/admin/users/reset-password/route.ts
export const runtime = 'nodejs'

import { NextResponse, NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { hasAdminKey } from '@/lib/supabase/admin'

function baseUrl() {
  const env = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (env) return env
  const h = headers()
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? ''
  return host ? `${proto}://${host}` : 'http://localhost:3000'
}

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
      // reset via anon key não precisa da service key, mas mantemos a checagem de admin
    }
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ error: 'email é obrigatório' }, { status: 400 })
    }

    // Envia e-mail de recuperação usando o client "padrão" (anon key),
    // que dispara o template de "Reset password" configurado no Supabase.
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl()}/auth/callback`,
    })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[api/admin/users/reset-password] fail:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}
