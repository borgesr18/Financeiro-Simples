// app/budget/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createActionClient } from '@/lib/supabase/actions'

/**
 * Exclui um orçamento por ID, garantindo que pertence ao usuário logado.
 */
export async function deleteBudget(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id)

  revalidatePath('/budget')
}

/**
 * (Opcional) Salva orçamento usando upsert (pode ser usado para criar/editar).
 * Mantém compat com coluna textual `category` se ela for NOT NULL.
 */
export async function upsertBudget(formData: FormData) {
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = String(formData.get('id') ?? '')
  const category_id = String(formData.get('category_id') ?? '')
  const year = Number(formData.get('year'))
  const month = Number(formData.get('month'))
  const amount = Number(formData.get('amount'))

  // Descobre nome da categoria para satisfazer `category` (texto), se existir NOT NULL
  let categoryName: string | null = null
  if (category_id) {
    const { data: cat } = await supabase
      .from('categories')
      .select('name')
      .eq('id', category_id)
      .eq('user_id', user.id)
      .maybeSingle()
    categoryName = cat?.name ?? null
  }

  // Se tiver id, faz UPDATE direto; senão, UPSERT por (user_id,year,month,category_id)
  if (id) {
    const { error } = await supabase
      .from('budgets')
      .update({
        category_id,
        year,
        month,
        amount,
        ...(categoryName ? { category: categoryName } : {}), // compat opcional
      })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: user.id,
          category_id,
          year,
          month,
          amount,
          ...(categoryName ? { category: categoryName } : {}), // compat opcional
        },
        { onConflict: 'user_id,year,month,category_id' }
      )
    if (error) throw new Error(error.message)
  }

  revalidatePath('/budget')
}
