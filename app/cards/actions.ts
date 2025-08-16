'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

// --- Helpers robustas (tratam vazio e clampam) ---
function clampInt(
  v: FormDataEntryValue | null,
  min: number,
  max: number,
  fb: number
) {
  // Trata string vazia como inválida (vira fb)
  const raw = typeof v === 'string' ? (v.trim() === '' ? NaN : Number(v)) : Number(v)
  if (!Number.isFinite(raw)) return fb
  const n = Math.trunc(raw as number)
  if (n < min || n > max) return fb
  return n
}

function toNum(v: FormDataEntryValue | null, fb = 0) {
  const raw = typeof v === 'string' ? (v.trim() === '' ? NaN : Number(v)) : Number(v)
  return Number.isFinite(raw) ? (raw as number) : fb
}

// ============ CREATE ============
export async function createCard(fd: FormData) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    const name = (fd.get('name') || 'Cartão').toString()
    const brand = (fd.get('brand') || '').toString() || null
    const last4 = (fd.get('last4') || '').toString() || null
    const institution = (fd.get('institution') || '').toString() || null
    const color_hex = (fd.get('color_hex') || '').toString() || null
    const icon_slug = (fd.get('icon_slug') || '').toString() || null
    const limit_amount = toNum(fd.get('limit_amount'), 0)

    const closing_day = clampInt(fd.get('closing_day'), 1, 28, 5)
    const due_day = clampInt(
      fd.get('due_day'),
      1,
      28,
      Math.min(28, closing_day + 7)
    )

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

    if (accErr) {
      console.error('[cards:createCard] accounts.insert error', accErr)
      throw accErr
    }

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

    if (cardErr) {
      console.error('[cards:createCard] cards.insert error', cardErr)
      throw cardErr
    }

    revalidatePath('/cards')
    redirect('/cards')
  } catch (e) {
    console.error('[cards:createCard] fail', e)
    throw new Error('Falha ao criar cartão')
  }
}

// ============ UPDATE ============
export async function updateCard(id: string, fd: FormData) {
  'use server'

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    // busca o card para pegar account_id
    const { data: card, error: cardGetErr } = await supabase
      .from('cards')
      .select('id, account_id')
      .eq('user_id', user.id)
      .eq('id', id)
      .single()

    if (cardGetErr || !card) {
      console.error('[cards:updateCard] get card error', cardGetErr)
      throw new Error('Cartão não encontrado')
    }

    const name = (fd.get('name') || '').toString() || null
    const brand = (fd.get('brand') || '').toString() || null
    const last4 = (fd.get('last4') || '').toString() || null
    const institution = (fd.get('institution') || '').toString() || null
    const color_hex = (fd.get('color_hex') || '').toString() || null
    const icon_slug = (fd.get('icon_slug') || '').toString() || null
    const limit_amount = toNum(fd.get('limit_amount'), 0)

    const closing_day = clampInt(fd.get('closing_day'), 1, 28, 5)
    const due_day = clampInt(
      fd.get('due_day'),
      1,
      28,
      Math.min(28, closing_day + 7)
    )

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

    if (cardErr) {
      console.error('[cards:updateCard] cards.update error', cardErr)
      throw cardErr
    }

    // espelha na account relacionada
    const { error: accErr } = await supabase
      .from('accounts')
      .update({ name, institution, color_hex, icon_slug })
      .eq('id', card.account_id)
      .eq('user_id', user.id)

    if (accErr) {
      console.error('[cards:updateCard] accounts.update error', accErr)
      throw accErr
    }

    revalidatePath('/cards')
    redirect('/cards')
  } catch (e) {
    console.error('[cards:updateCard] fail', e)
    throw new Error('Falha ao atualizar cartão')
  }
}

// ============ ARCHIVE ============
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

  if (error) {
    console.error('[cards:archiveCard] error', error)
    throw new Error('Falha ao arquivar cartão')
  }
  revalidatePath('/cards')
}

// ============ STATEMENTS ============
function computeCycle(closingDay: number, base = new Date()) {
  const y = base.getFullYear()
  const m = base.getMonth()
  const today = base.getDate()

  let end = new Date(y, m, closingDay)
  let start = new Date(y, m - 1, closingDay + 1)
  if (today <= closingDay) {
    end = new Date(y, m - 1, closingDay)
    start = new Date(y, m - 2, closingDay + 1)
  }
  const toISO = (d: Date) => d.toISOString().slice(0, 10)
  return { startISO: toISO(start), endISO: toISO(end) }
}

export async function generateStatement(cardId: string) {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const { data: c, error: cErr } = await supabase
    .from('cards')
    .select('id, account_id, closing_day, due_day')
    .eq('user_id', user.id)
    .eq('id', cardId)
    .single()

  if (cErr || !c) {
    console.error('[cards:generateStatement] get card error', cErr)
    throw new Error('Cartão não encontrado')
  }

  const { startISO, endISO } = computeCycle(c.closing_day)
  const end = new Date(endISO)
  const due = new Date(end.getFullYear(), end.getMonth(), c.due_day)
  const dueISO = due.toISOString().slice(0, 10)

  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .select('amount, date')
    .eq('user_id', user.id)
    .eq('account_id', c.account_id)
    .gte('date', startISO)
    .lte('date', endISO)
    .limit(5000)

  if (txErr) {
    console.error('[cards:generateStatement] tx select error', txErr)
    throw txErr
  }

  const total = (tx ?? []).reduce((acc, t: any) => {
    const a = Number(t.amount) || 0
    return a < 0 ? acc + Math.abs(a) : acc
  }, 0)

  const { data: existing, error: exErr } = await supabase
    .from('card_statements')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('card_id', c.id)
    .eq('cycle_start', startISO)
    .eq('cycle_end', endISO)
    .maybeSingle()

  if (exErr) {
    console.error('[cards:generateStatement] existing select error', exErr)
    throw exErr
  }

  if (existing?.id) {
    const { error: upErr } = await supabase
      .from('card_statements')
      .update({ amount_total: total })
      .eq('id', existing.id)
      .eq('user_id', user.id)
    if (upErr) {
      console.error('[cards:generateStatement] update error', upErr)
      throw upErr
    }
  } else {
    const { error: insErr } = await supabase
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
    if (insErr) {
      console.error('[cards:generateStatement] insert error', insErr)
      throw insErr
    }
  }

  revalidatePath(`/cards/${cardId}/statements`)
}

export async function payStatement(statementId: string, payFromAccountId: string) {
  'use server'
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  const { data: st, error: stErr } = await supabase
    .from('card_statements')
    .select('id, card_id, amount_total, due_date')
    .eq('user_id', user.id)
    .eq('id', statementId)
    .single()

  if (stErr || !st) {
    console.error('[cards:payStatement] get statement error', stErr)
    throw new Error('Fatura não encontrada')
  }

  const amount = Number(st.amount_total) || 0
  if (amount <= 0) throw new Error('Valor da fatura inválido')

  const { data: card, error: cErr } = await supabase
    .from('cards')
    .select('account_id')
    .eq('user_id', user.id)
    .eq('id', st.card_id)
    .single()

  if (cErr || !card?.account_id) {
    console.error('[cards:payStatement] get card error', cErr)
    throw new Error('Conta do cartão não encontrada')
  }

  const group = randomUUID()
  const dateISO = st.due_date as string

  const { error: e1 } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: payFromAccountId,
    date: dateISO,
    description: 'Pagamento de fatura',
    amount: -amount,
    type: 'expense',
    transfer_group: group,
  })
  if (e1) {
    console.error('[cards:payStatement] insert #1 error', e1)
    throw e1
  }

  const { error: e2 } = await supabase.from('transactions').insert({
    user_id: user.id,
    account_id: card.account_id,
    date: dateISO,
    description: 'Pagamento recebido - fatura',
    amount: amount,
    type: 'income',
    transfer_group: group,
  })
  if (e2) {
    console.error('[cards:payStatement] insert #2 error', e2)
    throw e2
  }

  const { error: upErr } = await supabase
    .from('card_statements')
    .update({ status: 'paid' })
    .eq('id', statementId)
    .eq('user_id', user.id)

  if (upErr) {
    console.error('[cards:payStatement] update statement error', upErr)
    throw upErr
  }

  revalidatePath(`/cards/${st.card_id}/statements`)
  revalidatePath('/cards')
}

