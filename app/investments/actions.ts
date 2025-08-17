'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function requireField(v: FormDataEntryValue | null, name: string) {
  const s = (v ?? '').toString().trim()
  if (!s) throw new Error(`Campo obrigatório: ${name}`)
  return s
}

export async function createInvestment(formData: FormData) {
  const supabase = createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Não autenticado')

  const name = requireField(formData.get('name'), 'Nome')
  const type = (formData.get('type') ?? 'other').toString()
  const institution = (formData.get('institution') ?? '').toString() || null
  const currency = (formData.get('currency') ?? 'BRL').toString()
  const color_hex = (formData.get('color_hex') ?? '').toString() || null
  const icon_slug = (formData.get('icon_slug') ?? '').toString() || null
  const notes = (formData.get('notes') ?? '').toString() || null

  const { error } = await supabase
    .from('investments')
    .insert({
      user_id: user.id,
      name,
      type,
      institution,
      currency,
      color_hex,
      icon_slug,
      notes,
    })

  if (error) {
    console.error('[investments:create] supabase error:', error)
    throw new Error('Falha ao criar investimento')
  }

  revalidatePath('/investments')
  redirect('/investments')
}

export async function updateInvestment(formData: FormData) {
  const supabase = createClient()
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) throw new Error('Não autenticado')

  const id = requireField(formData.get('id'), 'ID')
  const name = requireField(formData.get('name'), 'Nome')
  const type = (formData.get('type') ?? 'other').toString()
  const institution = (formData.get('institution') ?? '').toString() || null
  const currency = (formData.get('currency') ?? 'BRL').toString()
  const color_hex = (formData.get('color_hex') ?? '').toString() || null
  const icon_slug = (formData.get('icon_slug') ?? '').toString() || null
  const notes = (formData.get('notes') ?? '').toString() || null

  const { error } = await supabase
    .from('investments')
    .update({
      name,
      type,
      institution,
      currency,
      color_hex,
      icon_slug,
      notes,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[investments:update] supabase error:', error)
    throw new Error('Falha ao atualizar investimento')
  }

  revalidatePath('/investments')
  redirect('/investments')
}

