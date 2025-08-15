// app/settings/categories/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Cria uma categoria para o usuário logado.
 * Campos aceitos: name (obrigatório), color (opcional), icon (opcional)
 */
export async function createCategory(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name = String(formData.get('name') ?? '').trim()
  const color = formData.get('color') ? String(formData.get('color')) : null
  const icon = formData.get('icon') ? String(formData.get('icon')) : null

  if (!name) return

  const { error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name, color, icon })

  // Ignora erro de duplicidade (índice único por user_id + lower(name))
  if (error && error.code !== '23505') {
    console.error('createCategory error:', error)
  }

  revalidatePath('/settings/categories')
}

/**
 * Exclui uma categoria do usuário logado.
 * Campo aceito: id (obrigatório)
 */
export async function deleteCategory(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('deleteCategory error:', error)
  }

  revalidatePath('/settings/categories')
}

/**
 * (Opcional) Atualiza uma categoria do usuário logado.
 * Campos aceitos: id (obrigatório), name (opcional), color (opcional), icon (opcional)
 */
export async function updateCategory(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const payload: { name?: string; color?: string | null; icon?: string | null } = {}
  if (formData.has('name')) {
    const name = String(formData.get('name') ?? '').trim()
    if (name) payload.name = name
  }
  if (formData.has('color')) {
    payload.color = formData.get('color') ? String(formData.get('color')) : null
  }
  if (formData.has('icon')) {
    payload.icon = formData.get('icon') ? String(formData.get('icon')) : null
  }

  if (Object.keys(payload).length === 0) return

  const { error } = await supabase
    .from('categories')
    .update(payload)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error && error.code !== '23505') {
    console.error('updateCategory error:', error)
  }

  revalidatePath('/settings/categories')
}
