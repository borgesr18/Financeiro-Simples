'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'

// Utils
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

const toStr = (v: FormDataEntryValue | null) => {
  const s = (v ?? '').toString().trim()
  return s || null
}

function normMoney(v: FormDataEntryValue | null, fb = 0) {
  const s = (v ?? '').toString().trim()
  if (!s) return fb
  // aceita "1.234,56" e "1234.56"
  const norm = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(norm)
  return Number.isFinite(n) ? n : fb
}

const must = (v: string | null, label: string) => {
  if (!v) throw new Error(`${label} é obrigatório`)
  return v
}

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * Cria uma conta e, se "initial_balance" vier preenchido, registra um lançamento de saldo inicial
 * na tabela transactions usando o próprio cliente supabase (nada de fetch pro REST sem header).
 */
export async function createAccount(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  try {
    const name = must(toStr(fd.get('name')), 'Nome')
    const type = (toStr(fd.get('type')) ?? 'other') as
      | 'wallet' | 'checking' | 'savings' | 'credit' | 'investment' | 'other'
    const institution = toStr(fd.get('institution'))
    const currency = (toStr(fd.get('currency')) ?? 'BRL') as string
    const color_hex = toStr(fd.get('color_hex')) // ex: #3264ff
    const icon_slug = toStr(fd.get('icon_slug')) // ex: 'FaWallet'

    // 1) Cria a conta
    const { data: acc, error: e1 } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name,
        type,
        institution,
        currency,
        color_hex,
        icon_slug,
        archived: false,
      })
      .select('id')
      .single()

    if (e1) {
      console.error('[banking:createAccount] insert account', {
        code: (e1 as any).code, message: e1.message, details: (e1 as any).details, hint: (e1 as any).hint
      })
      throw new Error(e1.message || 'Falha ao criar conta')
    }

    // 2) Se veio saldo inicial, registra um lançamento
    const initial_balance = normMoney(fd.get('initial_balance'), 0)
    if (initial_balance !== 0) {
      const amountAbs = Math.abs(initial_balance)
      const typeTx: 'in' | 'out' = initial_balance >= 0 ? 'in' : 'out'

      const payload = {
        user_id: user.id,
        date: todayISO(),
        description: 'Saldo inicial',
        amount: amountAbs,      // gravamos positivo; "type" define o sentido
        type: typeTx,           // 'in' (crédito) | 'out' (débito)
        account_id: acc.id,
        // category_id: null, // coloque aqui uma categoria padrão se sua coluna for NOT NULL
      }

      const { error: e2 } = await supabase.from('transactions').insert(payload)
      if (e2) {
        console.error('[banking:createAccount] insert initial balance', {
          payload,
          code: (e2 as any).code, message: e2.message, details: (e2 as any).details, hint: (e2 as any).hint
        })
        // rollback: apaga a conta criada para não ficar "meio termo"
        await supabase.from('accounts').delete().eq('id', acc.id).eq('user_id', user.id)
        throw new Error(e2.message || 'Conta criada, mas falha ao registrar saldo inicial')
      }
    }

  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[banking:createAccount] fail', e)
    throw e
  }

  revalidatePath('/banking')
  revalidatePath('/transactions')
  revalidatePath('/')
  redirect('/banking')
}

export async function updateAccount(id: string, fd: FormData) {
  if (!isUuid(id)) throw new Error('Conta inválida')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  try {
    const name = must(toStr(fd.get('name')), 'Nome')
    const type = (toStr(fd.get('type')) ?? 'other') as
      | 'wallet' | 'checking' | 'savings' | 'credit' | 'investment' | 'other'
    const institution = toStr(fd.get('institution'))
    const currency = (toStr(fd.get('currency')) ?? 'BRL') as string
    const color_hex = toStr(fd.get('color_hex'))
    const icon_slug = toStr(fd.get('icon_slug'))
    const archived = (toStr(fd.get('archived')) === 'true')

    const { error } = await supabase
      .from('accounts')
      .update({ name, type, institution, currency, color_hex, icon_slug, archived })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[banking:updateAccount]', {
        code: (error as any).code, message: error.message, details: (error as any).details, hint: (error as any).hint
      })
      throw new Error(error.message || 'Falha ao atualizar conta')
    }
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[banking:updateAccount] fail', e)
    throw e
  }

  revalidatePath('/banking')
  redirect('/banking')
}

export async function archiveAccount(id: string, archived: boolean) {
  if (!isUuid(id)) throw new Error('Conta inválida')

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  const { error } = await supabase
    .from('accounts')
    .update({ archived })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[banking:archiveAccount]', {
      code: (error as any).code, message: error.message, details: (error as any).details, hint: (error as any).hint
    })
    throw new Error(error.message || 'Falha ao alterar status da conta')
  }

  revalidatePath('/banking')
}

