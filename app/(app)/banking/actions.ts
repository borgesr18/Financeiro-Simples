// app/(app)/banking/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/** Converte valores monetários em pt-BR para número JS. Aceita "1.234,56" ou "1234.56". */
function parseMoneyBR(input: FormDataEntryValue | null): number {
  if (input === null || input === undefined) return 0
  let s = String(input).trim()
  if (!s) return 0
  // mantém sinal
  const sign = s.startsWith('-') ? -1 : 1
  s = s.replace(/[^0-9.,-]/g, '')
  // se tem vírgula, ela é decimal; pontos são milhares
  if (s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.')
  }
  const n = Number(s)
  if (Number.isNaN(n)) return 0
  return Math.round(n * 100) / 100 * sign
}

async function requireUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}

/** Cria conta + (opcional) saldo inicial via lançamento em `transactions` */
export async function createAccount(fd: FormData) {
  const { supabase, user } = await requireUser()

  const name = String(fd.get('name') ?? '').trim()
  const type = (fd.get('type') as string) || 'other'
  const institution = (fd.get('institution') as string) || null
  const color_hex = (fd.get('color_hex') as string) || null
  const icon_slug = (fd.get('icon_slug') as string) || null
  const currency = (fd.get('currency') as string) || 'BRL'

  if (!name) throw new Error('Nome é obrigatório')

  const { data: acc, error } = await supabase
    .from('accounts')
    .insert({
      user_id: user.id,
      name,
      type,
      institution,
      color_hex,
      icon_slug,
      currency,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[banking:createAccount] insert accounts', error)
    throw new Error('Falha ao criar conta')
  }

  // Saldo inicial (opcional)
  const opening = parseMoneyBR(fd.get('opening_balance'))
  const openingDate = (fd.get('opening_date') as string) || new Date().toISOString().slice(0, 10)
  if (opening !== 0) {
    const { error: e2 } = await supabase.from('transactions').insert({
      user_id: user.id,
      account_id: acc.id,
      date: openingDate,
      description: 'Saldo inicial',
      amount: opening, // >0 crédito / <0 débito
      type: opening > 0 ? 'income' : 'expense',
    })
    if (e2) {
      console.error('[banking:createAccount] opening balance tx', e2)
      // Preferimos não remover a conta criada; apenas avisamos
      throw new Error('Conta criada, mas falhou o lançamento do saldo inicial')
    }
  }

  revalidatePath('/banking')
  revalidatePath('/transactions')
  revalidatePath('/')
  redirect('/banking')
}

/** Atualiza conta (não mexe em saldo) */
export async function updateAccount(fd: FormData) {
  const { supabase, user } = await requireUser()

  const id = String(fd.get('id') ?? '')
  const name = String(fd.get('name') ?? '').trim()
  const type = (fd.get('type') as string) || 'other'
  const institution = (fd.get('institution') as string) || null
  const currency = (fd.get('currency') as string) || 'BRL'
  const color_hex = (fd.get('color_hex') as string) || null
  const icon_slug = (fd.get('icon_slug') as string) || null

  if (!id) throw new Error('ID da conta ausente')
  if (!name) throw new Error('Nome é obrigatório')

  const { error } = await supabase
    .from('accounts')
    .update({ name, type, institution, currency, color_hex, icon_slug })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[banking:updateAccount] update accounts', error)
    throw new Error('Falha ao atualizar conta')
  }

  revalidatePath('/banking')
  revalidatePath('/')
  redirect('/banking')
}

/** Arquiva / Reativa conta */
export async function archiveAccount(fd: FormData) {
  const { supabase, user } = await requireUser()

  const id = String(fd.get('id') ?? '')
  const archived = String(fd.get('archived') ?? 'false') === 'true'
  if (!id) throw new Error('ID da conta ausente')

  const { error } = await supabase
    .from('accounts')
    .update({ archived })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[banking:archiveAccount] update archived', error)
    throw new Error('Falha ao alterar status da conta')
  }

  revalidatePath('/banking')
  redirect('/banking')
}

/** Exclui conta (falha se houver lançamentos vinculados sem ON DELETE CASCADE) */
export async function deleteAccount(fd: FormData) {
  const { supabase, user } = await requireUser()
  const id = String(fd.get('id') ?? '')
  if (!id) throw new Error('ID da conta ausente')

  const { error } = await supabase
    .from('accounts')
    .delete()
    .eq('id', id)
  // Nota: RLS na tabela já restringe ao user_id do token.

  if (error) {
    // 23503 = foreign_key_violation
    const fk = (error as any)?.code === '23503'
    console.error('[banking:deleteAccount] delete accounts', error)
    if (fk) {
      throw new Error('Não é possível excluir: existem lançamentos vinculados. Arquive a conta.')
    }
    throw new Error('Falha ao excluir conta')
  }

  revalidatePath('/banking')
  revalidatePath('/transactions')
  redirect('/banking')
}

/** Transferência entre contas (gera duas transações espelhadas) */
export async function createTransfer(fd: FormData) {
  const { supabase, user } = await requireUser()

  const from_id = String(fd.get('from_account_id') ?? '')
  const to_id = String(fd.get('to_account_id') ?? '')
  const amountNum = parseMoneyBR(fd.get('amount'))
  const date = (fd.get('date') as string) || new Date().toISOString().slice(0, 10)
  const description = (fd.get('description') as string) || 'Transferência'

  if (!from_id || !to_id) throw new Error('Contas de origem e destino são obrigatórias')
  if (from_id === to_id) throw new Error('Contas de origem e destino devem ser diferentes')
  if (!amountNum || amountNum <= 0) throw new Error('Valor inválido')

  // Garante que ambas as contas pertencem ao usuário
  const { data: accounts, error: eAcc } = await supabase
    .from('accounts')
    .select('id')
    .in('id', [from_id, to_id])
    .eq('user_id', user.id)

  if (eAcc || !accounts || accounts.length !== 2) {
    console.error('[banking:createTransfer] valida contas', eAcc, accounts)
    throw new Error('Contas inválidas ou sem permissão')
  }

  // Saída da origem (valor negativo)
  const debit = {
    user_id: user.id,
    account_id: from_id,
    date,
    description,
    amount: -Math.abs(amountNum),
    type: 'expense' as const,
  }

  // Entrada no destino (valor positivo)
  const credit = {
    user_id: user.id,
    account_id: to_id,
    date,
    description,
    amount: Math.abs(amountNum),
    type: 'income' as const,
  }

  const { error: e1 } = await supabase.from('transactions').insert([debit, credit])
  if (e1) {
    console.error('[banking:createTransfer] insert txs', e1)
    throw new Error('Falha ao registrar transferência')
  }

  revalidatePath('/banking')
  revalidatePath('/transactions')
  redirect('/banking')
}
