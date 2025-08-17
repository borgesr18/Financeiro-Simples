'use server'

import { revalidatePath, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Entity = 'accounts' | 'budgets' | 'categories' | 'goals' | 'transactions'

async function requireUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')
  return { supabase, user }
}

/** Envia um registro pra Lixeira (soft-delete) */
export async function softDeleteAction(fd: FormData) {
  const { supabase, user } = await requireUser()
  const entity = String(fd.get('entity') ?? '')
  const id = String(fd.get('id') ?? '')
  const back = (fd.get('back') as string) || '/'

  if (!id || !entity) throw new Error('Parâmetros ausentes')

  const { error } = await supabase
    .from(entity as Entity)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[trash:softDelete]', entity, error)
    throw new Error('Falha ao enviar para a lixeira')
  }

  revalidatePath(back)
  revalidatePath('/settings/trash')
  redirect('/settings/trash')
}

/** Restaura um item da Lixeira */
export async function restoreAction(fd: FormData) {
  const { supabase, user } = await requireUser()
  const entity = String(fd.get('entity') ?? '')
  const id = String(fd.get('id') ?? '')
  if (!id || !entity) throw new Error('Parâmetros ausentes')

  const { error } = await supabase
    .from(entity as Entity)
    .update({ deleted_at: null })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[trash:restore]', entity, error)
    throw new Error('Falha ao restaurar item')
  }

  revalidatePath('/settings/trash')
  // envia de volta pra lista do módulo
  const back = ({
    accounts: '/banking',
    budgets: '/budget',
    categories: '/settings/categories',
    goals: '/goals',
    transactions: '/transactions',
  } as Record<Entity, string>)[entity as Entity] ?? '/'
  revalidatePath(back)
  redirect(back)
}

/**
 * Exclusão definitiva
 * - accounts => chama RPC hard_delete_account (move/if-empty/purge)
 * - demais   => DELETE simples
 */
export async function hardDeleteAction(fd: FormData) {
  const { supabase, user } = await requireUser()
  const entity = String(fd.get('entity') ?? '')
  const id = String(fd.get('id') ?? '')
  if (!id || !entity) throw new Error('Parâmetros ausentes')

  if (entity === 'accounts') {
    const mode = String(fd.get('mode') ?? 'if-empty') // 'if-empty' | 'move' | 'purge'
    const target = (fd.get('target_account_id') as string) || null

    const { error } = await supabase.rpc('hard_delete_account', {
      p_user_id: user.id,
      p_account_id: id,
      p_mode: mode,
      p_target_account_id: target,
    })

    if (error) {
      console.error('[trash:hardDeleteAccount rpc]', error)
      throw new Error(error.message || 'Falha ao excluir conta definitivamente')
    }

    revalidatePath('/banking')
  } else {
    const { error } = await supabase
      .from(entity as Entity)
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[trash:hardDelete]', entity, error)
      throw new Error('Falha ao excluir definitivamente')
    }

    const back = ({
      budgets: '/budget',
      categories: '/settings/categories',
      goals: '/goals',
      transactions: '/transactions',
    } as Record<string, string>)[entity] ?? '/'
    revalidatePath(back)
  }

  revalidatePath('/settings/trash')
  redirect('/settings/trash')
}

/**
 * BÔNUS: desfaz a criação de CONTA se:
 *  - criada há <= 10 minutos
 *  - não tem lançamentos (ou só o “Saldo inicial”)
 */
export async function undoNewAccountAction(fd: FormData) {
  const { supabase, user } = await requireUser()
  const id = String(fd.get('id') ?? '')
  if (!id) throw new Error('ID ausente')

  // dados da conta
  const { data: acc, error: e1 } = await supabase
    .from('accounts')
    .select('id, created_at')
    .eq('id', id)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (e1 || !acc) throw new Error('Conta não encontrada')

  const created = new Date(acc.created_at).getTime()
  const minutes = (Date.now() - created) / 60000
  if (minutes > 10) throw new Error('Prazo para desfazer criação expirou')

  // quantos lançamentos?
  const { data: txs, error: e2 } = await supabase
    .from('transactions')
    .select('id, description')
    .eq('user_id', user.id)
    .eq('account_id', id)
    .is('deleted_at', null)

  if (e2) throw new Error('Falha ao verificar lançamentos')

  const safe =
    (txs ?? []).length === 0 ||
    ((txs ?? []).length === 1 &&
      (txs?.[0].description || '').toLowerCase() === 'saldo inicial')

  if (!safe)
    throw new Error('A conta já possui lançamentos; use a lixeira para excluir')

  // apaga eventual saldo inicial
  if ((txs ?? []).length === 1) {
    await supabase.from('transactions').delete().eq('id', txs![0].id)
  }

  // apaga a conta
  const { error: e3 } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)
  if (e3) throw new Error('Falha ao apagar conta')

  revalidatePath('/banking')
  redirect('/banking')
}
