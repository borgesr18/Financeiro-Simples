'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

/* =========================
   Helpers de saneamento
   ========================= */
function clampInt(
  v: FormDataEntryValue | null,
  min: number,
  max: number,
  fb: number
) {
  const raw =
    typeof v === 'string' ? (v.trim() === '' ? NaN : Number(v)) : Number(v)
  if (!Number.isFinite(raw)) return fb
  const n = Math.trunc(raw as number)
  if (n < min || n > max) return fb
  return n
}

function toNum(v: FormDataEntryValue | null, fb = 0) {
  const raw =
    typeof v === 'string' ? (v.trim() === '' ? NaN : Number(v)) : Number(v)
  return Number.isFinite(raw) ? (raw as number) : fb
}

function strOrNull(v: FormDataEntryValue | null) {
  const s = (v ?? '').toString().trim()
  return s === '' ? null : s
}

/* =========================
   CREATE
   ========================= */
export async function createCard(fd: FormData) {
  'use server'

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    const nameRaw = (fd.get('name') ?? '').toString().trim()
    const name = nameRaw || 'Cartão' // nunca null

    const brand = strOrNull(fd.get('brand'))
    const last4 = strOrNull(fd.get('last4'))
    const institution = strOrNull(fd.get('institution'))
    const color_hex = strOrNull(fd.get('color_hex'))
    const icon_slug = strOrNull(fd.get('icon_slug'))
    const limit_amount = toNum(fd.get('limit_amount'), 0)

    const closing_day = clampInt(fd.get('closing_day'), 1, 28, 5)
    const due_day = clampInt(
      fd.get('due_day'),
      1,
      28,
      Math.min(28, closing_day + 7)
    )

    // 1) cria a account tipo 'credit'
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

    // 2) cria o card vinculado
    const { error: cardErr } = await supabase.from('cards').insert({
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

/* =========================
   UPDATE (resiliente)
   ========================= */
export async function updateCard(id: string, fd: FormData) {
  'use server'

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    // 1) Busca cartão atual (fallbacks/validações)
    const { data: current, error: getErr } = await supabase
      .from('cards')
      .select(
        'id, account_id, name, brand, last4, limit_amount, closing_day, due_day, institution, color_hex, icon_slug, archived'
      )
      .eq('user_id', user.id)
      .eq('id', id)
      .single()

    if (getErr || !current) {
      console.error('[cards:updateCard] get card error', getErr)
      throw new Error('Cartão não encontrado')
    }

    // 2) Saneia campos do formulário
    const nameRaw = (fd.get('name') ?? '').toString().trim()
    const name = nameRaw || current.name // nunca null

    const brand = strOrNull(fd.get('brand'))
    const last4 = strOrNull(fd.get('last4'))
    const institution = strOrNull(fd.get('institution'))
    const color_hex = strOrNull(fd.get('color_hex'))
    const icon_slug = strOrNull(fd.get('icon_slug'))
    const limit_amount = toNum(fd.get('limit_amount'), current.limit_amount ?? 0)

    const closing_day = clampInt(
      fd.get('closing_day'),
      1,
      28,
      current.closing_day ?? 5
    )
    const due_day = clampInt(
      fd.get('due_day'),
      1,
      28,
      current.due_day ?? Math.min(28, closing_day + 7)
    )

    const archived =
      (fd.get('archived') || '').toString().trim().toLowerCase() === 'on'

    // 3) Atualiza CARDS (sempre)
    const cardUpd: any = {
      name,
      limit_amount,
      closing_day,
      due_day,
      archived,
    }
    // opcionais — podem ser null nessas colunas:
    cardUpd.brand = brand
    cardUpd.last4 = last4
    cardUpd.institution = institution
    cardUpd.color_hex = color_hex
    cardUpd.icon_slug = icon_slug

    const { error: cardErr } = await supabase
      .from('cards')
      .update(cardUpd)
      .eq('user_id', user.id)
      .eq('id', id)

    if (cardErr) {
      console.error('[cards:updateCard] cards.update error', cardErr)
      throw cardErr
    }

    // 4) Espelha em ACCOUNTS (NÃO derruba a ação se falhar)
    try {
      const accUpd: any = { name } // name nunca null
      if (institution !== null) accUpd.institution = institution
      if (color_hex !== null) accUpd.color_hex = color_hex
      if (icon_slug !== null) accUpd.icon_slug = icon_slug

      const { error: accErr } = await supabase
        .from('accounts')
        .update(accUpd)
        .eq('id', current.account_id)
        .eq('user_id', user.id)

      if (accErr) {
        console.error(
          '[cards:updateCard] accounts.update error (IGNORADO)',
          accErr
        )
        // não lançamos — segue o fluxo
      }
    } catch (accTryErr) {
      console.error(
        '[cards:updateCard] accounts.update exception (IGNORADO)',
        accTryErr
      )
      // não lançamos — segue o fluxo
    }

    // 5) Revalida e redireciona
    revalidatePath('/cards')
    redirect('/cards')
  } catch (e) {
    console.error('[cards:updateCard] fail', e)
    throw new Error('Falha ao atualizar cartão')
  }
}

/* =========================
   ARCHIVE
   ========================= */
export async function archiveCard(id: string) {
  'use server'

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

/* =========================
   STATEMENTS
   ========================= */
function computeCycle(closingDay: number, base = new Date()) {
  const y = base.getFullYear()
  const m = base.getMonth()
  const today = base.getDate()

  let end = new Date(y, m, closingDay)
  let start = new Date(y, m - 1, closingDay + 1)

  // se ainda não passou do fechamento deste mês, volta um ciclo
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
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  // totaliza apenas saídas (valores negativos)
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
    const { error: insErr } = await supabase.from('card_statements').insert({
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

/* =========================
   PAY STATEMENT
   ========================= */
export async function payStatement(
  statementId: string,
  payFromAccountId: string
) {
  'use server'

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  // 1) Saída da conta de pagamento
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

  // 2) Entrada na conta do cartão (reduz devedor)
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

  // 3) Marca como paga
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
