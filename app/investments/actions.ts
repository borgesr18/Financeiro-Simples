// app/investments/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isRedirectError } from 'next/dist/client/components/redirect'

function toNum(v: FormDataEntryValue | null, fb = 0) {
  const raw = typeof v === 'string' ? (v.trim() === '' ? NaN : Number(v)) : Number(v)
  return Number.isFinite(raw) ? (raw as number) : fb
}
function strOrNull(v: FormDataEntryValue | null) {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

/* CREATE */
export async function createInvestment(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    const name = ((fd.get('name') ?? '') as string).trim() || 'Investimento'
    const type = ((fd.get('type') ?? '') as string).trim() || 'other'
    const institution = strOrNull(fd.get('institution'))
    const currency = ((fd.get('currency') ?? 'BRL') as string).trim() || 'BRL'
    const color_hex = strOrNull(fd.get('color_hex'))
    const icon_slug = strOrNull(fd.get('icon_slug'))
    const current_value = toNum(fd.get('current_value'), 0)

    const { error } = await supabase.from('investments').insert({
      user_id: user.id,
      name,
      type,
      institution,
      currency,
      color_hex,
      icon_slug,
      current_value,
    })
    if (error) throw error
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[investments:create] fail', e)
    throw new Error('Falha ao criar investimento')
  }

  revalidatePath('/investments')
  redirect('/investments')
}

/* UPDATE (id vem no form como input hidden) */
export async function updateInvestment(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const id = (fd.get('id') ?? '').toString()
  if (!id) throw new Error('ID inválido')

  try {
    const name = ((fd.get('name') ?? '') as string).trim()
    const type = ((fd.get('type') ?? '') as string).trim()
    const institution = strOrNull(fd.get('institution'))
    const currency = ((fd.get('currency') ?? '') as string).trim()
    const color_hex = strOrNull(fd.get('color_hex'))
    const icon_slug = strOrNull(fd.get('icon_slug'))
    const current_value = toNum(fd.get('current_value'), undefined as any)

    const upd: any = {}
    if (name) upd.name = name
    if (type) upd.type = type
    if (currency) upd.currency = currency
    upd.institution = institution
    upd.color_hex = color_hex
    upd.icon_slug = icon_slug
    if (typeof current_value === 'number' && Number.isFinite(current_value)) {
      upd.current_value = current_value
    }

    const { error } = await supabase
      .from('investments')
      .update(upd)
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[investments:update] fail', e)
    throw new Error('Falha ao atualizar investimento')
  }

  revalidatePath('/investments')
  redirect('/investments')
}


