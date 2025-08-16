'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

function toInt(v: FormDataEntryValue | null, fb = 1) {
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : fb
}

function toNum(v: FormDataEntryValue | null, fb = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fb
}

/** Cria cartão + conta (type=credit) e redireciona para /cards */
export async function createCard(fd: FormData) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const name = (fd.get('name') || 'Cartão').toString()
  const brand = (fd.get('brand') || '').toString() || null
  const last4 = (fd.get('last4') || '').toString() || null
  const institution = (fd.get('institution') || '').toString() || null
  const color_hex = (fd.get('color_hex') || '').toString() || null
  const icon_slug = (fd.get('icon_slug') || '').toString() || null
  const limit_amount = toNum(fd.get('limit_amount'), 0)
  const closing_day = toInt(fd.get('closing_day'), 5)
  const due_day = toInt(fd.get('due_day'), Math.min(28, closing_day + 7))

  // 1) cria a account tipo credit
  const { data: acc, error: accErr } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name,
      type: 'credit',
      institution,
      color_hex,
      icon_slug,
      currency: 'BRL',
    })
    .select('id')
    .single()

  if (accErr) throw accErr

  // 2) cria o card vinculado à account
  const { error: cardErr } = await supabase
    .from('cards')
    .insert({
      user_id: user.id,
      account_id: acc!.id,
      name,
      brand,
      last4,
      limit_amount,
      closing_day,
      due_day,
      institution,
      color_hex,
      icon_slug,
    })

  if (cardErr) throw cardErr

  revalidatePath('/cards')
  redirect('/cards')
}

/** Atualiza cartão e espelha ícone/cor/nome na conta relacionada, depois redireciona */
export async function updateCard(id: string, fd: FormData) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  // busca o card para pegar account_id
  const { data: card } = await supabase
    .from('cards')
    .select('id, account_id')
    .eq('user_id', user.id)
    .eq('id', id)
    .single()

  if (!card) throw new Error('Cartão não encontrado')

  const name = (fd.get('name') || '').toString() || null
  const brand = (fd.get('brand') || '').toString() || null
  const last4 = (fd.get('last4') || '').toString() || null
  const institution = (fd.get('institution') || '').toString() || null
  const color_hex = (fd.get('color_hex') || '').toString() || null
  const icon_slug = (fd.get('icon_slug') || '').toString() || null
  const limit_amount = toNum(fd.get('limit_amount'), 0)
  const closing_day = toInt(fd.get('closing_day'), 5)
  const due_day = toInt(fd.get('due_day'), Math.min(28, closing_day + 7))
  const archived = (fd.get('archived') || '').toString() === 'on'

  const { error: cardErr } = await supabase
    .from('cards')
    .update({
      name, brand, last4, institution,
      color_hex, icon_slug,
      limit_amount, closing_day, due_day, archived,
    })
    .eq('user_id', user.id)
    .eq('id', id)

  if (cardErr) throw cardErr

  // espelha na account relacionada
  const { error: accErr } = await supabase
    .from('accounts')
    .update({ name, institution, color_hex, icon_slug })
    .eq('id', card.account_id)
    .eq('user_id', user.id)

  if (accErr) throw accErr

  revalidatePath('/cards')
  redirect('/cards')
}

/** Arquiva cartão */
export async function archiveCard(id: string) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const { error } = await supabase
    .from('cards')
    .update({ archived: true })
    .eq('user_id', user.id)
    .eq('id', id)

  if (error) throw error
  revalidatePath('/cards')
}

/** Calcula ciclo de fatura a partir do dia de fechamento */
function computeCycle(closingDay: number, base = new Date()) {
  const y = base.getFullYear()
  const m = base.getMonth()
  const today = base.getDate()

  // ciclo: (dia seguinte ao fechamento anterior) até (dia de fechamento atual)
  let end = new Date(y, m, closingDay)
  let start = new Date(y, m - 1, closingDay + 1)

  if (today <= closingDay) {
    end = new Date(y, m - 1, closingDay)
    start = new Date(y, m - 2, closingDay + 1)
  }

  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { startISO: toISO(start), endISO: toISO(end) }
}

/** Gera/atualiza a fatura do ciclo atual do cartão */
export async function generateStatement(cardId: string) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const { data: c } = await supabase
    .from('cards')
    .select('id, account_id, closing_day, due_day')
    .eq('user_id', user.id)
    .eq('id', cardId)
    .single()

  if (!c) throw new Error('Cartão não encontrado')

  const { startISO, endISO } = computeCycle(c.closing_day)

  // due_date no mês do endISO
  const end = new Date(endISO)
  const due = new Date(end.getFullYear(), end.getMonth(), c.due_day)
  const dueISO = due.toISOString().slice(0, 10)

  // soma compras do período (amount < 0) na conta do cartão
  const { data: tx } = await supabase
    .from('transactions')
    .select('amount, date')
    .eq('user_id', user.id)
    .eq('account_id', c.account_id)
    .gte('date', startISO)
    .lte('date', endISO)
    .limit(5000)

  const total = (tx ?? []).reduce((acc, t: any) => {
    const a = Number(t.amount) || 0
    return a < 0 ? acc + Math.abs(a) : acc
  }, 0)

  // upsert da fatura do ciclo
  const { data: existing } = await supabase
    .from('card_statements')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('card_id', c.id)
    .eq('cycle_start', startISO)
    .eq('cycle_end', endISO)
    .maybeSingle()

  if (existing?.id) {
    await supabase
      .from('card_statements')
      .update({ amount_total: total })
      .eq('id', existing.id)
      .eq('user_id', user.id)
  } else {
    await supabase
      .from('card_statements')
      .insert({
        user_id: user.id,
        card_id: c.id,
        cycle_start: startISO,
        cycle_end: endISO,
        due_date: dueISO,
        status: 'closed',
        amount_total: total,
      })
  }

  revalidatePath(`/cards/${cardId}/statements`)
}

/** Paga a fatura (saída da conta pagadora e entrada na conta do cartão) */
export async function payStatement(statementId: string, payFromAccountId: string) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  // pega a fatura
  const { data: st } = await supabase
    .from('card_statements')
    .select('id, card_id, amount_total, due_date')
    .eq('user_id', user.id)
    .eq('id', statementId)
    .single()

  if (!st) throw new Error('Fatura não encontrada')

  const amount = Number(st.amount_total) || 0
  if (amount <= 0) throw new Error('Valor da fatura inválido')

  // busca a conta do cartão (sem nested select p/ evitar tipagem de array)
  const { data: card } = await supabase
    .from('cards')
    .select('account_id')
    .eq('user_id', user.id)
    .eq('id', st.card_id)
    .single()

  const cardAccountId = card?.account_id
  if (!cardAccountId) throw new Error('Conta do cartão não encontrada')

  const group = randomUUID()
  const dateISO = st.due_date as string

  // 1) saída na conta pagadora
  const { error: e1 } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: payFromAccountId,
    date: dateISO,
    description: 'Pagamento de fatura',
    amount: -amount,
    type: 'expense',
    transfer_group: group,
  })
  if (e1) throw e1

  // 2) entrada na conta do cartão (reduz dívida)
  const { error: e2 } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: cardAccountId,
    date: dateISO,
    description: 'Pagamento recebido - fatura',
    amount: amount,
    type: 'income',
    transfer_group: group,
  })
  if (e2) throw e2

  await supabase
    .from('card_statements')
    .update({ status: 'paid' })
    .eq('id', statementId)
    .eq('user_id', user.id)

  revalidatePath(`/cards/${st.card_id}/statements`)
  revalidatePath('/cards')
}
