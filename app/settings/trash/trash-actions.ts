'use server'

/**
 * Ações server-side para Lixeira (soft delete / restore / purge).
 * - Usa revalidatePath de 'next/cache' (correto no Next 14).
 * - Valida entidade e id recebidos do FormData.
 * - Garante escopo por usuário via user_id.
 * - Loga erros com prefixo para facilitar no Vercel logs.
 */

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type Entity =
  | 'accounts'
  | 'budgets'
  | 'categories'
  | 'goals'
  | 'transactions'
  | 'cards' // caso já exista módulo de cartões

const VALID_ENTITIES = new Set<Entity>([
  'accounts',
  'budgets',
  'categories',
  'goals',
  'transactions',
  'cards',
])

async function requireUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('[trash-actions] getUser error:', error)
  }
  if (!user) {
    redirect('/login')
  }
  return { supabase, user }
}

function pickEntity(form: FormData): Entity {
  const raw = String(form.get('entity') ?? '').trim() as Entity
  if (!VALID_ENTITIES.has(raw)) {
    throw new Error(`Entidade inválida: "${raw}"`)
  }
  return raw
}

function pickId(form: FormData): string {
  const id = String(form.get('id') ?? '').trim()
  if (!id) throw new Error('ID ausente')
  // aceita UUID v4 ou similar; não vamos regexar forte para não quebrar ids diferentes
  return id
}

function pathsToRevalidate(entity: Entity) {
  const base: string[] = [
    '/', // dashboard pode refletir totais
    '/settings/trash',
    '/transactions',
    '/budget',
    '/goals',
    '/settings/categories',
    '/banking',
    '/cards',
  ]
  // Não duplicar; usar Set para garantir único
  return Array.from(new Set(base))
}

/**
 * Envia item para lixeira: seta deleted_at = now()
 * Para contas, também marcamos archived = true (se existir a coluna).
 */
export async function softDeleteAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  try {
    const entity = pickEntity(formData)
    const id = pickId(formData)

    // Monta payload genérico
    const nowIso = new Date().toISOString()
    const patch: Record<string, any> = { deleted_at: nowIso }

    if (entity === 'accounts') {
      // se a tabela tiver archived
      patch.archived = true
    }

    const { error } = await supabase
      .from(entity)
      .update(patch)
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) {
      console.error('[trash-actions] softDeleteAction supabase error:', error)
      throw new Error('Falha ao enviar para a lixeira')
    }

    for (const p of pathsToRevalidate(entity)) revalidatePath(p)
  } catch (e) {
    console.error('[trash-actions] softDeleteAction fail:', e)
    throw e
  }

  redirect('/settings/trash')
}

/**
 * Restaura item da lixeira: deleted_at = null
 * Para contas, archived = false (se existir a coluna).
 */
export async function restoreAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  try {
    const entity = pickEntity(formData)
    const id = pickId(formData)

    const patch: Record<string, any> = { deleted_at: null }
    if (entity === 'accounts') {
      patch.archived = false
    }

    const { error } = await supabase
      .from(entity)
      .update(patch)
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) {
      console.error('[trash-actions] restoreAction supabase error:', error)
      throw new Error('Falha ao restaurar item')
    }

    for (const p of pathsToRevalidate(entity)) revalidatePath(p)
  } catch (e) {
    console.error('[trash-actions] restoreAction fail:', e)
    throw e
  }

  redirect('/settings/trash')
}

/**
 * Exclusão definitiva (purge / hard delete).
 * IMPORTANTE: só use se tiver certeza — remove o registro de fato.
 * RLS + eq(user_id) protege escopo.
 */
export async function purgeAction(formData: FormData) {
  const { supabase, user } = await requireUser()

  try {
    const entity = pickEntity(formData)
    const id = pickId(formData)

    const { error } = await supabase
      .from(entity)
      .delete()
      .eq('id', id)
      .eq('user_id', user!.id)

    if (error) {
      console.error('[trash-actions] purgeAction supabase error:', error)
      throw new Error('Falha ao excluir definitivamente')
    }

    for (const p of pathsToRevalidate(entity)) revalidatePath(p)
  } catch (e) {
    console.error('[trash-actions] purgeAction fail:', e)
    throw e
  }

  redirect('/settings/trash')
}

