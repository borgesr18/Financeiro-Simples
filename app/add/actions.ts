'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { isRedirectError } from 'next/dist/client/components/redirect'

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s)

function normMoney(v: FormDataEntryValue | null, fb = NaN) {
  const s = (v ?? '').toString().trim()
  if (!s) return fb
  // aceita "1.234,56" e "1234.56"
  const norm = s.replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  const n = Number(norm)
  return Number.isFinite(n) ? n : fb
}
const str = (v: FormDataEntryValue | null) => {
  const s = (v ?? '').toString().trim()
  return s || null
}
const must = (v: string | null, label: string) => {
  if (!v) throw new Error(`${label} é obrigatório`)
  return v
}

export async function createTransaction(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem sessão')

  try {
    const date = must((fd.get('date') ?? '').toString(), 'Data')
    const description = str(fd.get('description')) ?? ''
    const rawType = (fd.get('type') ?? 'out').toString()
    const type: 'in' | 'out' = rawType === 'in' ? 'in' : 'out'

    const account_id = must((fd.get('account_id') ?? '').toString(), 'Conta')
    const category_id = must((fd.get('category_id') ?? '').toString(), 'Categoria')
    if (!isUuid(account_id)) throw new Error('Conta inválida')
    if (!isUuid(category_id)) throw new Error('Categoria inválida')

    const amount = normMoney(fd.get('amount'), NaN)
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Valor inválido')

    const payload = {
      user_id: user.id,
      date,
      description,
      amount,       // gravamos sempre positivo; o sentido vem de "type"
      type,         // 'in' | 'out'
      category_id,
      account_id,
    }

    const { error } = await supabase.from('transactions').insert(payload)
    if (error) {
      console.error('[transactions:create]', {
        payload,
        code: (error as any).code,
        message: error.message,
        details: (error as any).details,
        hint: (error as any).hint,
      })
      throw new Error(error.message || 'Falha ao salvar lançamento')
    }
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[transactions:create] fail', e)
    throw e
  }

  // Atualiza listas e volta para Lançamentos
  revalidatePath('/transactions')
  revalidatePath('/')
  redirect('/transactions')
}
