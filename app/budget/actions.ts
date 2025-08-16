// app/budget/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createActionClient } from '@/lib/supabase/actions'

type Parsed = {
  id?: string | null
  category_id: string
  year?: number
  month?: number
  amount: number
  period?: string
}

function parseForm(formData: FormData): Parsed {
  const id = (formData.get('id') ?? '') as string
  const category_id = String(formData.get('category_id') ?? '')
  const amount = Number(formData.get('amount') ?? 0)

  // Aceita year/month ou period (YYYY-MM)
  const y = formData.get('year')
  const m = formData.get('month')
  const year = y != null && y !== '' ? Number(y) : undefined
  const month = m != null && m !== '' ? Number(m) : undefined

  let period: string | undefined = undefined
  if (year && month) period = `${year}-${String(month).padStart(2, '0')}`
  if (!period) {
    const p = String(formData.get('period') ?? '')
    if (p) period = p
  }

  return {
    id: id || undefined,
    category_id,
    year,
    month,
    amount,
    period,
  }
}

/** Descobre o nome da categoria para preencher o campo textual `category` se necessário */
async function getCategoryName(supabase: ReturnType<typeof createActionClient>, userId: string, category_id: string) {
  if (!category_id) return null
  const { data } = await supabase
    .from('categories')
    .select('name')
    .eq('id', category_id)
    .eq('user_id', userId)
    .maybeSingle()
  return data?.name ?? null
}

/** Cria (ou faz upsert) do orçamento. Chamado pela página /budget/new */
export async function createBudget(formData: FormData) {
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const p = parseForm(formData)
  const categoryText = await getCategoryName(supabase, user.id, p.category_id)

  // 1) Tenta modelo year/month
  let errYM: any = null
  if (p.year && p.month) {
    const { error } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: user.id,
          category_id: p.category_id,
          year: p.year,
          month: p.month,
          amount: p.amount,
          ...(categoryText ? { category: categoryText } : {}), // compat se `category` (text) ainda for NOT NULL
        },
        { onConflict: 'user_id,year,month,category_id' }
      )
    errYM = error
  } else {
    errYM = { code: 'MISSING_YM' }
  }

  // 2) Se der erro por coluna inexistente, cai para period
  if (errYM && (errYM.code === '42703' || /column .* does not exist/i.test(errYM.message ?? '') || errYM.code === 'MISSING_YM')) {
    const period = p.period
    if (!period) throw new Error('Período não informado (YYYY-MM).')

    const { error: e2 } = await supabase
      .from('budgets')
      .upsert(
        {
          user_id: user.id,
          category_id: p.category_id,
          period,
          amount: p.amount,
          ...(categoryText ? { category: categoryText } : {}),
        },
        { onConflict: 'user_id,period,category_id' }
      )
    if (e2) throw new Error(e2.message)
  } else if (errYM) {
    throw new Error(errYM.message)
  }

  revalidatePath('/budget')
}

/** Atualiza um orçamento existente por ID. Chamado pela página /budget/[id]/edit */
export async function updateBudget(formData: FormData) {
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const p = parseForm(formData)
  if (!p.id) throw new Error('ID do orçamento não informado.')

  const categoryText = await getCategoryName(supabase, user.id, p.category_id)

  // Tenta atualizar usando year/month; se não existir no schema, cai para period
  let { error } = await supabase
    .from('budgets')
    .update({
      category_id: p.category_id,
      year: p.year,
      month: p.month,
      amount: p.amount,
      ...(categoryText ? { category: categoryText } : {}),
    })
    .eq('id', p.id)
    .eq('user_id', user.id)

  if (error && (error.code === '42703' || /column .* does not exist/i.test(error.message ?? ''))) {
    if (!p.period && !(p.year && p.month)) {
      throw new Error('Informe period (YYYY-MM) ou year/month.')
    }
    const period = p.period ?? `${p.year}-${String(p.month).padStart(2, '0')}`
    const res2 = await supabase
      .from('budgets')
      .update({
        category_id: p.category_id,
        period,
        amount: p.amount,
        ...(categoryText ? { category: categoryText } : {}),
      })
      .eq('id', p.id)
      .eq('user_id', user.id)
    if (res2.error) throw new Error(res2.error.message)
  } else if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/budget')
}

/** Exclui um orçamento por ID. Usado na tabela da página /budget */
export async function deleteBudget(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id)
  if (error) throw new Error(error.message)

  revalidatePath('/budget')
}

/* Exporte também upsertBudget, se alguém já estiver usando esse nome */
export async function upsertBudget(formData: FormData) {
  if ((formData.get('id') ?? '') as string) {
    return updateBudget(formData)
  }
  return createBudget(formData)
}
