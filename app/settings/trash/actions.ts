'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Entity =
  | 'accounts'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'goals'
  | 'cards'
  | 'investments'

async function requireUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Não autenticado')
  }
  return { supabase, user }
}

/**
 * Envia um item para a lixeira (soft delete: seta deleted_at = now()).
 * Campos esperados no FormData: entity, id
 */
export async function softDeleteAction(formData: FormData) {
  const { supabase, user } = await requireUser()
  const entity = String(formData.get('entity') || '') as Entity
  const id = String(formData.get('id') || '')

  if (!id || !entity) throw new Error('Parâmetros inválidos')

  try {
    const now = new Date().toISOString()

    switch (entity) {
      case 'accounts': {
        const { error } = await supabase
          .from('accounts')
          .update({ deleted_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/banking')
        revalidatePath('/settings/trash')
        return
      }

      case 'transactions': {
        const { error } = await supabase
          .from('transactions')
          .update({ deleted_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/transactions')
        revalidatePath('/settings/trash')
        return
      }

      case 'categories': {
        const { error } = await supabase
          .from('categories')
          .update({ deleted_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/settings/categories')
        revalidatePath('/settings/trash')
        return
      }

      case 'budgets': {
        const { error } = await supabase
          .from('budgets')
          .update({ deleted_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/budget')
        revalidatePath('/settings/trash')
        return
      }

      case 'goals': {
        const { error } = await supabase
          .from('goals')
          .update({ deleted_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/goals')
        revalidatePath('/settings/trash')
        return
      }

      case 'cards': {
        const { error } = await supabase
          .from('cards')
          .update({ deleted_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/cards')
        revalidatePath('/settings/trash')
        return
      }

      case 'investments': {
        const { error } = await supabase
          .from('investments')
          .update({ deleted_at: now })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/investments')
        revalidatePath('/settings/trash')
        return
      }

      default:
        throw new Error('Entidade desconhecida')
    }
  } catch (err) {
    console.error('[trash-actions] softDeleteAction supabase error:', err)
    throw new Error('Falha ao enviar para a lixeira')
  }
}

/**
 * Restaura um item da lixeira (deleted_at = null).
 * Campos esperados no FormData: entity, id
 */
export async function restoreAction(formData: FormData) {
  const { supabase, user } = await requireUser()
  const entity = String(formData.get('entity') || '') as Entity
  const id = String(formData.get('id') || '')

  if (!id || !entity) throw new Error('Parâmetros inválidos')

  try {
    switch (entity) {
      case 'accounts': {
        const { error } = await supabase
          .from('accounts')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/banking')
        revalidatePath('/settings/trash')
        return
      }

      case 'transactions': {
        const { error } = await supabase
          .from('transactions')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/transactions')
        revalidatePath('/settings/trash')
        return
      }

      case 'categories': {
        const { error } = await supabase
          .from('categories')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/settings/categories')
        revalidatePath('/settings/trash')
        return
      }

      case 'budgets': {
        const { error } = await supabase
          .from('budgets')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/budget')
        revalidatePath('/settings/trash')
        return
      }

      case 'goals': {
        const { error } = await supabase
          .from('goals')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/goals')
        revalidatePath('/settings/trash')
        return
      }

      case 'cards': {
        const { error } = await supabase
          .from('cards')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/cards')
        revalidatePath('/settings/trash')
        return
      }

      case 'investments': {
        const { error } = await supabase
          .from('investments')
          .update({ deleted_at: null })
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/investments')
        revalidatePath('/settings/trash')
        return
      }

      default:
        throw new Error('Entidade desconhecida')
    }
  } catch (err) {
    console.error('[trash-actions] restoreAction supabase error:', err)
    throw new Error('Falha ao restaurar item')
  }
}

/**
 * Purga (exclui definitivamente) um item da lixeira.
 * Para ACCOUNTS: apaga primeiro TRANSACTIONS daquela conta e só depois a conta.
 * Para CARDS: remove transações ligadas à account do cartão, remove a account, depois o card.
 * Campos esperados no FormData: entity, id
 */
export async function purgeAction(formData: FormData) {
  const { supabase, user } = await requireUser()
  const entity = String(formData.get('entity') || '') as Entity
  const id = String(formData.get('id') || '')

  if (!id || !entity) throw new Error('Parâmetros inválidos')

  try {
    switch (entity) {
      case 'accounts': {
        const { error: txErr } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('account_id', id)
        if (txErr) throw txErr

        const { error: accErr } = await supabase
          .from('accounts')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (accErr) throw accErr

        revalidatePath('/banking')
        revalidatePath('/settings/trash')
        return
      }

      case 'transactions': {
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/transactions')
        revalidatePath('/settings/trash')
        return
      }

      case 'categories': {
        // tenta desassociar; se não puder (FK sem null), apaga as transações da categoria
        const { error: unsetErr } = await supabase
          .from('transactions')
          .update({ category_id: null })
          .eq('user_id', user.id)
          .eq('category_id', id)

        if (unsetErr) {
          const { error: delTx } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .eq('category_id', id)
          if (delTx) throw delTx
        }

        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error

        revalidatePath('/settings/categories')
        revalidatePath('/settings/trash')
        return
      }

      case 'budgets': {
        const { error } = await supabase
          .from('budgets')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/budget')
        revalidatePath('/settings/trash')
        return
      }

      case 'goals': {
        const { error } = await supabase
          .from('goals')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/goals')
        revalidatePath('/settings/trash')
        return
      }

      case 'cards': {
        // Busca a account do cartão (se existir)
        const { data: card, error: cardErr } = await supabase
          .from('cards')
          .select('id, account_id')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()
        if (cardErr) throw cardErr

        const cardAccountId = (card as any)?.account_id as string | null

        if (cardAccountId) {
          const { error: delTx } = await supabase
            .from('transactions')
            .delete()
            .eq('user_id', user.id)
            .eq('account_id', cardAccountId)
          if (delTx) throw delTx

          const { error: delAcc } = await supabase
            .from('accounts')
            .delete()
            .eq('id', cardAccountId)
            .eq('user_id', user.id)
          if (delAcc) throw delAcc
        }

        const { error } = await supabase
          .from('cards')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error

        revalidatePath('/cards')
        revalidatePath('/settings/trash')
        return
      }

      case 'investments': {
        const { error } = await supabase
          .from('investments')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        if (error) throw error
        revalidatePath('/investments')
        revalidatePath('/settings/trash')
        return
      }

      default:
        throw new Error('Entidade desconhecida')
    }
  } catch (err: any) {
    console.error('[trash-actions] purgeAction supabase error:', err)
    if (err?.code === '23503') {
      throw new Error('Não foi possível excluir definitivamente: existem registros relacionados.')
    }
    throw new Error('Falha ao excluir definitivamente')
  }
}

// alias opcional para compatibilidade
export { purgeAction as hardDeleteAction }

