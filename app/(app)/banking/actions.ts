// app/(app)/banking/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createActionClient } from '@/lib/supabase/actions'

export async function createAccount(formData: FormData) {
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? 'other')
  const institution = String(formData.get('institution') ?? '').trim() || null
  const color_hex = String(formData.get('color_hex') ?? '').trim() || null
  const icon_slug = String(formData.get('icon_slug') ?? '').trim() || null
  const currency = String(formData.get('currency') ?? 'BRL').trim()

  if (!name) throw new Error('Informe o nome da conta.')

  const { error } = await supabase.from('accounts').insert({
    user_id: user.id, name, type, institution, color_hex, icon_slug, currency
  })
  if (error) throw new Error(error.message)

  revalidatePath('/banking')
}

export async function updateAccount(formData: FormData) {
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = String(formData.get('id') ?? '')
  const name = String(formData.get('name') ?? '').trim()
  const type = String(formData.get('type') ?? 'other')
  const institution = String(formData.get('institution') ?? '').trim() || null
  const color_hex = String(formData.get('color_hex') ?? '').trim() || null
  const icon_slug = String(formData.get('icon_slug') ?? '').trim() || null
  const currency = String(formData.get('currency') ?? 'BRL').trim()
  const archived = String(formData.get('archived') ?? '') === 'on'

  if (!id) throw new Error('ID não informado.')
  const { error } = await supabase
    .from('accounts')
    .update({ name, type, institution, color_hex, icon_slug, currency, archived })
    .eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/banking')
}

export async function deleteAccount(formData: FormData) {
  // soft-delete: arquiva
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = String(formData.get('id') ?? '')
  if (!id) return

  const { error } = await supabase
    .from('accounts')
    .update({ archived: true })
    .eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/banking')
}

export async function createTransfer(formData: FormData) {
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const from_id = String(formData.get('from_id') ?? '')
  const to_id = String(formData.get('to_id') ?? '')
  const amount = Number(formData.get('amount') ?? 0)
  const date = String(formData.get('date') ?? '')
  const notes = String(formData.get('notes') ?? '').trim()

  if (!from_id || !to_id) throw new Error('Selecione as contas.')
  if (from_id === to_id) throw new Error('Contas devem ser diferentes.')
  if (!amount || amount <= 0) throw new Error('Informe um valor positivo.')

  const when = date || new Date().toISOString().slice(0, 10)
  const desc = notes ? `Transferência: ${notes}` : 'Transferência'

  // duas transações espelhadas
  const payload = [
    {
      user_id: user.id,
      account_id: from_id,
      date: when,
      description: desc,
      amount: -Math.abs(amount), // saída
      category_id: null, // categoria vazia (transferência interna)
    },
    {
      user_id: user.id,
      account_id: to_id,
      date: when,
      description: desc,
      amount: Math.abs(amount), // entrada
      category_id: null,
    }
  ]

  const { error } = await supabase.from('transactions').insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath('/banking')
  revalidatePath('/transactions')
}
