// app/api/admin/users/route.ts
import 'server-only'
import { NextResponse } from 'next/server'
import { createAdminClient, hasAdminKey } from '@/lib/supabase/admin'

export const runtime = 'nodejs'

export async function GET() {
  try {
    if (!hasAdminKey()) {
      return NextResponse.json(
        { error: 'Service Role não configurada' },
        { status: 500 }
      )
    }
    const admin = createAdminClient()
    const { data, error } = await admin.auth.admin.listUsers()
    if (error) {
      console.error('[admin/users] listUsers error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ users: data.users })
  } catch (err: any) {
    console.error('[admin/users] GET fatal:', err)
    return NextResponse.json({ error: 'Falha ao listar usuários' }, { status: 500 })
  }
}
