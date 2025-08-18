'use server'

import { revalidatePath } from 'next/cache'
import { requireActiveUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

/**
 * Cria conta e (opcional) registra saldo inicial via transação.
 * Espera no FormData:
 * - name, type, institution?, color_hex?, icon_slug?, currency?
 * - opening_balance? (string número BRL/decimal)
 */
export async function createAccount(fd: FormData) {
  try {
    const { supabase, user } = await requireActiveUser()

    const name = String(fd.get('name') ?? '').trim()
    const type = String(fd.get('type') ?? 'other')
    const institution = (fd.get('institution') ?? '') as string
    const color_hex = (fd.get('color_hex') ?? '') as string
    const icon_slug = (fd.get('icon_slug') ?? '') as string
    const currency = (fd.get('currency') ?? 'BRL') as string
    const openingStr = String(fd.get('opening_balance') ?? '').replace('.', '').replace(',', '.').trim()
    const opening_balance = openingStr ? Number(openingStr) : 0

    if (!name) throw new Error('Informe o nome da conta.')

    const { data: acc, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name, type,
        institution: institution || null,
        color_hex: color_hex || null,
        icon_slug: icon_slug || null,
        currency,
      })
      .select('id')
      .single()

    if (error) throw error

    if (opening_balance && acc?.id) {
      // amount > 0 = entrada
      const { error: e2 } = await supabase.from('transactions').insert({
        user_id: user.id,
        account_id: acc.id,
        date: new Date().toISOString(),
        description: 'Saldo inicial',
        amount: Number(opening_balance),
      })
      if (e2) throw e2
    }

    revalidatePath('/banking')
    revalidatePath('/')
  } catch (e: any) {
    if (e?.code === 'SUSPENDED') throw new Error('Sua conta está suspensa. Não é possível criar contas.')
    throw e
  }
}

/**
 * Atualiza conta
 * Campos: id, name, type, institution?, color_hex?, icon_slug?, currency?
 */
export async function updateAccount(fd: FormData) {
  try {
    const { supabase, user } = await requireActiveUser()

    const id = String(fd.get('id') ?? '')
    const name = String(fd.get('name') ?? '').trim()
    const type = String(fd.get('type') ?? 'other')
    const institution = (fd.get('institution') ?? '') as string
    const color_hex = (fd.get('color_hex') ?? '') as string
    const icon_slug = (fd.get('icon_slug') ?? '') as string
    const currency = (fd.get('currency') ?? 'BRL') as string

    if (!id) throw new Error('Conta inválida')
    if (!name) throw new Error('Informe o nome da conta.')

    const { error } = await supabase
      .from('accounts')
      .update({
        name, type,
        institution: institution || null,
        color_hex: color_hex || null,
        icon_slug: icon_slug || null,
        currency,
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/banking')
  } catch (e: any) {
    if (e?.code === 'SUSPENDED') throw new Error('Sua conta está suspensa. Não é possível editar contas.')
    throw e
  }
}

/**
 * "Arquiva" / envia para lixeira (soft delete)
 * Campo: id
 */
export async function deleteAccount(fd: FormData) {
  try {
    const { supabase, user } = await requireActiveUser()

    const id = String(fd.get('id') ?? '')
    if (!id) throw new Error('Conta inválida')

    // usa lixeira padrão (deleted_at = now)
    const { error } = await supabase
      .from('accounts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    revalidatePath('/banking')
    revalidatePath('/settings/trash')
  } catch (e: any) {
    if (e?.code === 'SUSPENDED') throw new Error('Sua conta está suspensa. Não é possível arquivar contas.')
    throw e
  }
}

/**
 * Transfere entre contas do mesmo usuário
 * Campos: from_account_id, to_account_id, amount, description?
 */
export async function createTransfer(fd: FormData) {
  try {
    const { supabase, user } = await requireActiveUser()

    const fromId = String(fd.get('from_account_id') ?? '')
    const toId = String(fd.get('to_account_id') ?? '')
    const desc = (fd.get('description') ?? 'Transferência') as string
    const amtStr = String(fd.get('amount') ?? '').replace('.', '').replace(',', '.').trim()
    const amount = Number(amtStr)

    if (!fromId || !toId) throw new Error('Informe as contas.')
    if (!amount || amount <= 0) throw new Error('Valor inválido.')

    // saída na origem (negativo), entrada no destino (positivo)
    const now = new Date().toISOString()

    const { error: e1 } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: fromId,
      date: now,
      description: desc || 'Transferência',
      amount: -Math.abs(amount),
    })
    if (e1) throw e1

    const { error: e2 } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: toId,
      date: now,
      description: desc || 'Transferência',
      amount: Math.abs(amount),
    })
    if (e2) throw e2

    revalidatePath('/banking')
    revalidatePath('/')
  } catch (e: any) {
    if (e?.code === 'SUSPENDED') throw new Error('Sua conta está suspensa. Não é possível transferir valores.')
    throw e
  }
}
