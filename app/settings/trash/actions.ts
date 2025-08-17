// app/settings/trash/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type Entity =
  | 'accounts'
  | 'budgets'
  | 'categories'
  | 'goals'
  | 'transactions'
  | 'cards'

const ALLOWED: ReadonlySet<string> = new Set([
  'accounts',
  'budgets',
  'categories',
  'goals',
  'transactions',
  'cards',
])

function assertEntity(entity: string | null): asserts entity is Entity {
  if (!entity || !ALLOWED.has(entity)) {
    throw new Error('Entidade inválida para Lixeira')
  }
}

export async function softDeleteAction(fd: FormData) {
  const entity = fd.get('entity') as string | null
  const id = (fd.get('id') as string | null)?.trim()
  const back = (fd.get('back') as string | null) || '/settings/trash'

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

export async function restoreAction(fd: FormData) {
  const entity = fd.get('entity') as string | null
  const id = (fd.get('id') as string | null)?.trim()
  const back = (fd.get('back') as string | null) || '/settings/trash'

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

export async function purgeAction(fd: FormData) {
  const entity = fd.get('entity') as string | null
  const id = (fd.get('id') as string | null)?.trim()
  const back = (fd.get('back') as string | null) || '/settings/trash'

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

// ✅ Alias para compatibilidade com páginas que importam "hardDeleteAction"
export const hardDeleteAction = purgeAction

