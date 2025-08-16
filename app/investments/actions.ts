'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isRedirectError } from 'next/dist/client/components/redirect'

function num(v: FormDataEntryValue | null, fb = 0) {
  const s = (v ?? '').toString().trim()
  if (!s) return fb
  // aceita "1.234,56" e "1234.56"
  const norm = s.replace(/\./g, '').replace(',', '.')
  const n = Number(norm)
  return Number.isFinite(n) ? n : fb
}
const str = (v: FormDataEntryValue | null) => {
  const s = (v ?? '').toString().trim()
  return s || null
}

export async function createAsset(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    const ticker = (fd.get('ticker') ?? '').toString().trim().toUpperCase()
    if (!ticker) throw new Error('Ticker é obrigatório')
    const name = str(fd.get('name'))
    const klass = (fd.get('class') ?? 'stock').toString()
    const currency = (fd.get('currency') ?? 'BRL').toString()

    const { error } = await supabase.from('assets').insert({
      user_id: user.id,
      ticker, name, class: klass, currency
    })
    if (error) throw error
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[investments:createAsset]', e)
    throw new Error('Falha ao criar ativo')
  }
  revalidatePath('/investments')
  redirect('/investments')
}

export async function createTrade(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sem usuário')

  try {
    const date = (fd.get('date') ?? '').toString()
    const side = (fd.get('side') ?? 'buy').toString() as 'buy'|'sell'
    const account_id = (fd.get('account_id') ?? '').toString()
    const asset_id = (fd.get('asset_id') ?? '').toString()
    const quantity = num(fd.get('quantity'), 0)
    const price = num(fd.get('price'), 0)
    const fees = num(fd.get('fees'), 0)
    const notes = str(fd.get('notes'))

    if (!date || !account_id || !asset_id || quantity <= 0) {
      throw new Error('Preencha data, conta, ativo e quantidade > 0')
    }

    const { error } = await supabase.from('investment_trades').insert({
      user_id: user.id,
      date, side, account_id, asset_id, quantity, price, fees, notes
    })
    if (error) throw error
  } catch (e) {
    if (isRedirectError(e)) throw e
    console.error('[investments:createTrade]', e)
    throw new Error('Falha ao lançar operação')
  }
  revalidatePath('/investments')
  redirect('/investments')
}
