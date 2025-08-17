'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

type Entity =
  | 'accounts'
  | 'transactions'
  | 'categories'
  | 'budgets'
  | 'goals'
  | 'cards' // 👈 incluído

async function requireUser() {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
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
 * ACCOUNTS: apaga primeiro TRANSACTIONS daquela conta (evita FK 23503).
 * CATEGORIES: tenta desassociar transações; se não for permitido, apaga-as.
 * CARDS: tenta desreferenciar card_id em transactions e apagar faturas, se houver.
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
        // 1) Apaga lançamentos dessa conta
        const { error: txErr } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .eq('account_id', id)
        if (txErr) throw txErr

        // 2) Apaga a conta
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
        // Tenta remover referência primeiro
        const { error: unsetErr } = await supabase
          .from('transactions')
          .update({ category_id: null })
          .eq('user_id', user.id)
          .eq('category_id', id)

        if (unsetErr) {
          // Se a FK não permitir NULL, remove as transações dessa categoria
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
        // 0) Se houver tabela de faturas (card_statements), tenta limpar
        const delStatements = await supabase
          .from('card_statements')
          .delete()
          .eq('user_id', user.id)
          .eq('card_id', id)

        // Ignora caso a tabela não exista
        if (delStatements.error && delStatements.error.code !== '42P01') {
          throw delStatements.error
        }

        // 1) Desassocia transações referenciando o cartão (se a coluna existir)
        const unsetTx = await supabase
          .from('transactions')
          .update({ card_id: null })
          .eq('user_id', user.id)
          .eq('card_id', id)

        // Se a coluna não existir (42703), ignora; outros erros, lança
        if (unsetTx.error && unsetTx.error.code !== '42703') {
          throw unsetTx.error
        }

        // 2) Apaga o cartão
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

// Alias compatível com chamadas antigas
export { purgeAction as hardDeleteAction }

