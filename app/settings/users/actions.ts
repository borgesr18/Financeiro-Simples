// app/settings/users/actions.ts
'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/authz'

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!
  if (!url || !service) {
    throw new Error('Config ausente: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  }
  return createAdminClient(url, service, { auth: { persistSession: false } })
}

async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !(await isAdmin())) throw new Error('Acesso negado')
  return user
}

export async function inviteUser(prevState: any, formData: FormData) {
  await requireAdmin()
  const email = String(formData.get('email') || '').trim()
  if (!email) return { ok: false, message: 'Informe um e-mail' }

  try {
    const a = admin()
    const { data, error } = await a.auth.admin.inviteUserByEmail(email, {
      data: { role: 'user' },
    })
    if (error) throw error
    revalidatePath('/settings/users')
    return { ok: true, message: 'Convite enviado', data }
  } catch (err: any) {
    console.error('[users] inviteUser', err)
    return { ok: false, message: err?.message ?? 'Falha ao enviar convite' }
  }
}

export async function promoteToAdmin(_: any, formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return { ok: false, message: 'ID inválido' }

  try {
    const a = admin()
    const { data, error } = await a.auth.admin.updateUserById(id, {
      app_metadata: { role: 'admin' },
    })
    if (error) throw error
    revalidatePath('/settings/users')
    return { ok: true, message: 'Promovido a admin', data }
  } catch (err: any) {
    console.error('[users] promote', err)
    return { ok: false, message: err?.message ?? 'Falha ao promover' }
  }
}

export async function demoteToUser(_: any, formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return { ok: false, message: 'ID inválido' }

  try {
    const a = admin()
    const { data, error } = await a.auth.admin.updateUserById(id, {
      app_metadata: { role: 'user' },
    })
    if (error) throw error
    revalidatePath('/settings/users')
    return { ok: true, message: 'Rebaixado para usuário', data }
  } catch (err: any) {
    console.error('[users] demote', err)
    return { ok: false, message: err?.message ?? 'Falha ao rebaixar' }
  }
}

export async function deleteUser(_: any, formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  if (!id) return { ok: false, message: 'ID inválido' }

  try {
    const a = admin()
    const { error } = await a.auth.admin.deleteUser(id)
    if (error) throw error
    revalidatePath('/settings/users')
    return { ok: true, message: 'Usuário removido' }
  } catch (err: any) {
    console.error('[users] delete', err)
    return { ok: false, message: err?.message ?? 'Falha ao remover' }
  }
}
