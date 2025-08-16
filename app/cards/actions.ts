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
