'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'

/* Utils */
const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

const str = (v: FormDataEntryValue | null) => {
  const s = (v ?? '').toString().trim()
  return s || null
}
const must = (v: string | null, label: string) => {
  if (!v) throw new Error(`${label} é obrigatório`)
  return v
}
function normMoney(v: FormDataEntryValue | null, fb = 0) {
  const s = (v ?? '').toString().trim()
  if (!s) return fb
  const norm = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(norm)
  return Number.isFinite(n) ? n : fb
}
function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ------------------------------
   CONTAS
--------------------------------*/

/** Criar conta + saldo inicial opcional */
export async function createAccount(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  try {
    const name = must(str(fd.get('name')), 'Nome')
    const type = (str(fd.get('type')) ?? 'other') as
      | 'wallet' | 'checking' | 'savings' | 'credit' | 'investment' | 'other'
    const institution = str(fd.get('institution'))
    const currency = (str(fd.get('currency')) ?? 'BRL')!
    const color_hex = str(fd.get('color_hex'))
    const icon_slug = str(fd.get('icon_slug'))

    // 1) cria a conta
    const { data: acc, error: e1 } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        name, type, institution, currency,
        color_hex, icon_slug,
        archived: false,
      })
      .select('id')
      .single()

    if (e1) {
      console.error('[banking:createAccount] account', {
        code: (e1 as any).code, message: e1.message, details: (e1 as any).details, hint: (e1 as any).hint
      })
      throw new Error(e1.message || 'Falha ao criar conta')
    }

    // 2) saldo inicial (opcional)
    const initial = normMoney(fd.get('initial_balance'), 0)
    if (initial !== 0) {
      const payload = {
        user_id: user.id,
        date: todayISO(),
        description: 'Saldo inicial',
        amount: Math.abs(initial),
        type: initial >= 0 ? 'in' : 'out' as 'in' | 'out',
        account_id: acc.id,
        // category_id: null, // use se sua coluna permitir null
      }
      const { error: e2 } = await supabase.from('transactions').insert(payload)
      if (e2) {
        console.error('[banking:createAccount] initial', {
          payload,
          code: (e2 as any).code, message: e2.message, details: (e2 as any).details, hint: (e2 as any).hint
        })
        // rollback para não deixar conta sem o saldo esperado
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

/** Atualizar conta lendo o id do próprio FormData (para usar direto no <form action={...}>) */
export async function updateAccount(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  try {
    const id = must(str(fd.get('id')), 'ID')
    if (!isUuid(id)) throw new Error('Conta inválida')

    const name = must(str(fd.get('name')), 'Nome')
    const type = (str(fd.get('type')) ?? 'other') as
      | 'wallet' | 'checking' | 'savings' | 'credit' | 'investment' | 'other'
    const institution = str(fd.get('institution'))
    const currency = (str(fd.get('currency')) ?? 'BRL')!
    const color_hex = str(fd.get('color_hex'))
    const icon_slug = str(fd.get('icon_slug'))
    const archived = (str(fd.get('archived')) === 'true')

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

/** Arquivar/reativar conta (toggle) via FormData (id, archived) */
export async function archiveAccount(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  const id = must(str(fd.get('id')), 'ID')
  if (!isUuid(id)) throw new Error('Conta inválida')
  const archived = str(fd.get('archived')) === 'true'

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

/** Deletar conta definitivamente (via <form action={deleteAccount}>) */
export async function deleteAccount(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  const id = must(str(fd.get('id')), 'ID')
  if (!isUuid(id)) throw new Error('Conta inválida')

  // se houver lançamentos vinculados, o FK deve barrar — tratamos a msg
  const { error } = await supabase.from('accounts').delete().eq('id', id).eq('user_id', user.id)

  if (error) {
    // 23503 = violação de FK (tem transações ligadas)
    if ((error as any).code === '23503') {
      throw new Error('Essa conta possui lançamentos. Arquive-a em vez de excluir.')
    }
    console.error('[banking:deleteAccount]', {
      code: (error as any).code, message: error.message, details: (error as any).details, hint: (error as any).hint
    })
    throw new Error(error.message || 'Falha ao excluir conta')
  }

  revalidatePath('/banking')
}

/* ------------------------------
   TRANSFERÊNCIAS ENTRE CONTAS
--------------------------------*/

/** Cria 2 lançamentos (saída na origem, entrada no destino) em uma única chamada */
export async function createTransfer(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  try {
    const from = must(str(fd.get('from_account_id')), 'Conta de origem')
    const to   = must(str(fd.get('to_account_id')),   'Conta de destino')
    if (!isUuid(from) || !isUuid(to)) throw new Error('Conta inválida')
    if (from === to) throw new Error('Selecione contas diferentes')

    const amount = normMoney(fd.get('amount'), NaN)
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor inválido')

    const date = str(fd.get('date')) ?? todayISO()
    const description = str(fd.get('description')) ?? 'Transferência'

    // duas linhas em um único insert — atômico
    const rows = [
      {
        user_id: user.id,
        date,
        description,
        amount,
        type: 'out' as const,
        account_id: from,
      },
      {
        user_id: user.id,
        date,
        description,
        amount,
        type: 'in' as const,
        account_id: to,
      },
    ]

    const { error } = await supabase.from('transactions').insert(rows)
    if (error) {
      console.error('[banking:createTransfer]', {
        rows,
        code: (error as any).code, message: error.message, details: (error as any).details, hint: (error as any).hint
      })
      throw new Error(error.message || 'Falha ao transferir')
    }
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[banking:createTransfer] fail', e)
    throw e
  }

  revalidatePath('/banking')
  revalidatePath('/transactions')
  redirect('/banking')
}
