// app/settings/trash/trash-actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'   // ✅ aqui é 'next/cache'
import { redirect } from 'next/navigation'

type Entity =
  | 'accounts'
  | 'budgets'
  | 'categories'
  | 'goals'
  | 'transactions'
  | 'cards'

const ALLOWED: ReadonlySet<Entity> = new Set([
  'accounts',
  'budgets',
  'categories',
  'goals',
  'transactions',
  'cards',
])

function assertEntity(entity: string | null): asserts entity is Entity {
  if (!entity || !ALLOWED.has(entity as Entity)) {
    throw new Error('Entidade inválida para Lixeira')
  }
}

function getBack(fd: FormData) {
  return (fd.get('back') as string | null) || '/settings/trash'
}

/** Envia um item para a Lixeira (soft delete). Requer coluna `deleted_at timestamptz`. */
export async function softDeleteAction(fd: FormData) {
  const entity = fd.get('entity') as string | null
  const id = (fd.get('id') as string | null)?.trim()
  const back = getBack(fd)

  assertEntity(entity)
  if (!id) throw new Error('ID ausente')

  const supabase = createClient()
  const { error } = await supabase
    .from(entity)
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[trash:softDelete]', { entity, id, error })
    throw new Error('Falha ao enviar para Lixeira')
  }

  revalidatePath(back)
  redirect(back)
}

/** Restaura um item da Lixeira. */
export async function restoreAction(fd: FormData) {
  const entity = fd.get('entity') as string | null
  const id = (fd.get('id') as string | null)?.trim()
  const back = getBack(fd)

  assertEntity(entity)
  if (!id) throw new Error('ID ausente')

  const supabase = createClient()
  const { error } = await supabase
    .from(entity)
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) {
    console.error('[trash:restore]', { entity, id, error })
    throw new Error('Falha ao restaurar item')
  }

  revalidatePath(back)
  redirect(back)
}

/** Exclusão definitiva (hard delete). */
export async function purgeAction(fd: FormData) {
  const entity = fd.get('entity') as string | null
  const id = (fd.get('id') as string | null)?.trim()
  const back = getBack(fd)

  assertEntity(entity)
  if (!id) throw new Error('ID ausente')

  const supabase = createClient()
  const { error } = await supabase.from(entity).delete().eq('id', id)

  if (error) {
    console.error('[trash:purge]', { entity, id, error })
    throw new Error('Falha ao excluir definitivamente')
  }

  revalidatePath(back)
  redirect(back)
}

// Alias para compatibilidade com imports existentes
export const hardDeleteAction = purgeAction
