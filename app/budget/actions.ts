// app/budget/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isRedirectError } from 'next/dist/client/components/redirect'

function toInt(v: FormDataEntryValue | null, fb = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fb
}
function toNum(v: FormDataEntryValue | null, fb = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fb
}
function uuidOrThrow(v: FormDataEntryValue | null, msg = 'ID inválido') {
  const s = (v ?? '').toString().trim()
  if (!s) throw new Error(msg)
  return s
}

/** Cria orçamento (mês/ano/categoria/valor) */
export async function createBudget(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    const category_id = uuidOrThrow(fd.get('category_id'), 'Categoria obrigatória')
    const year = toInt(fd.get('year'), new Date().getFullYear())
    const month = Math.min(12, Math.max(1, toInt(fd.get('month'), new Date().getMonth() + 1)))
    const amount = toNum(fd.get('amount'), 0)

    const { error } = await supabase.from('budgets').insert({
      user_id: user.id,
      category_id,
      year,
      month,
      amount,
    })
    if (error) throw error
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[budget:createBudget] fail', e)
    throw new Error('Falha ao criar orçamento')
  }

  revalidatePath('/budget')
  redirect('/budget')
}

/** Atualiza orçamento (id no form) */
export async function updateBudget(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const id = uuidOrThrow(fd.get('id'))
  try {
    const patch: any = {}
    if (fd.has('category_id')) patch.category_id = uuidOrThrow(fd.get('category_id'))
    if (fd.has('year')) patch.year = toInt(fd.get('year'))
    if (fd.has('month')) patch.month = Math.min(12, Math.max(1, toInt(fd.get('month'))))
    if (fd.has('amount')) patch.amount = toNum(fd.get('amount'))

    const { error } = await supabase
      .from('budgets')
      .update(patch)
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[budget:updateBudget] fail', e)
    throw new Error('Falha ao atualizar orçamento')
  }

  revalidatePath('/budget')
  redirect('/budget')
}

/** Exclui definitivamente (mantendo comportamento antigo do módulo) */
export async function deleteBudget(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const id = uuidOrThrow(fd.get('id'))
  try {
    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) throw error
  } catch (e) {
    console.error('[budget:deleteBudget] fail', e)
    throw new Error('Falha ao excluir orçamento')
  }

  revalidatePath('/budget')
}
