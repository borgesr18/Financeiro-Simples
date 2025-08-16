// lib/accounts.ts
import { createClient } from '@/lib/supabase/server'

export type Account = {
  id: string
  name: string
  type: 'wallet' | 'checking' | 'savings' | 'credit' | 'investment' | 'other'
  institution: string | null
  color_hex: string | null
  icon_slug: string | null
  currency: string
  archived: boolean
}

export type AccountWithBalance = Account & { balance: number }

export async function getAccountsWithBalances(): Promise<AccountWithBalance[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Busca pela view
  const { data: rows, error } = await supabase
    .from('v_account_balances')
    .select('account_id, name, type, archived, user_id, balance')
    .eq('user_id', user.id)
    .order('archived', { ascending: true })
  if (error) throw new Error(error.message)

  // completa metadata da account (cor/ícone/institution/currency)
  const ids = (rows ?? []).map(r => r.account_id)
  const { data: meta } = await supabase
    .from('accounts')
    .select('id, institution, color_hex, icon_slug, currency')
    .in('id', ids)

  const metaMap = new Map(meta?.map(m => [m.id, m]) ?? [])
  return (rows ?? []).map(r => {
    const m = metaMap.get(r.account_id) ?? {}
    return {
      id: r.account_id,
      name: r.name,
      type: r.type,
      archived: r.archived,
      institution: (m as any).institution ?? null,
      color_hex: (m as any).color_hex ?? null,
      icon_slug: (m as any).icon_slug ?? null,
      currency: (m as any).currency ?? 'BRL',
      balance: Number(r.balance ?? 0),
    }
  })
}

export async function getAccountsSimple() {
  // para preencher selects (id, name) em forms
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('archived', false)
    .order('created_at')
  return data ?? []
}
