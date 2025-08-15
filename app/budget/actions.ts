'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const budgetSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.string().min(1, 'Informe a categoria'),
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  amount: z.coerce.number().min(0, 'Valor não pode ser negativo'),
})

/** helper para montar o redirect de volta para a lista no mês/ano escolhido */
function toList(year: number, month: number) {
  return `/budget?year=${year}&month=${month}`
}

export async function createBudget(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent('/budget/new')}`)
  }

  const data = {
    category: formData.get('category'),
    year: formData.get('year'),
    month: formData.get('month'),
    amount: formData.get('amount'),
  }

  const parsed = budgetSchema.safeParse(data)
  if (!parsed.success) {
    const err = parsed.error.flatten().fieldErrors
    return { error: 'Dados inválidos', details: err }
  }

  const payload = parsed.data

  // tenta inserir com user_id explícito; se você criou o trigger que preenche user_id,
  // isso vai só redundar (sem problema).
  const { error } = await supabase.from('budgets').insert({
    user_id: user.id,
    category: payload.category,
    year: payload.year,
    month: payload.month,
    amount: payload.amount,
  })

  if (error) {
    console.error('createBudget error:', error)
    return { error: 'Falha ao criar orçamento.' }
  }

  revalidatePath('/budget')
  redirect(toList(payload.year, payload.month))
}

export async function updateBudget(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent('/budget')}`)
  }

  const data = {
    id: formData.get('id'),
    category: formData.get('category'),
    year: formData.get('year'),
    month: formData.get('month'),
    amount: formData.get('amount'),
  }

  const parsed = budgetSchema.extend({ id: z.string().uuid() }).safeParse(data)
  if (!parsed.success) {
    const err = parsed.error.flatten().fieldErrors
    return { error: 'Dados inválidos', details: err }
  }

  const payload = parsed.data

  const { error } = await supabase
    .from('budgets')
    .update({
      category: payload.category,
      year: payload.year,
      month: payload.month,
      amount: payload.amount,
    })
    .eq('id', payload.id)
    .eq('user_id', user!.id)

  if (error) {
    console.error('updateBudget error:', error)
    return { error: 'Falha ao atualizar orçamento.' }
  }

  revalidatePath('/budget')
  redirect(toList(payload.year, payload.month))
}

export async function deleteBudget(formData: FormData) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirectTo=${encodeURIComponent('/budget')}`)
  }

  const id = String(formData.get('id') ?? '')
  const year = Number(formData.get('year') ?? '')
  const month = Number(formData.get('month') ?? '')

  if (!id) return { error: 'ID inválido.' }

  const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', user!.id)

  if (error) {
    console.error('deleteBudget error:', error)
    return { error: 'Falha ao excluir orçamento.' }
  }

  revalidatePath('/budget')
  redirect(Number.isFinite(year) && Number.isFinite(month) ? toList(year, month) : '/budget')
}
