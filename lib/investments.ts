import { createClient } from '@/lib/supabase/server'

export type Position = {
  asset_id: string
  ticker: string
  name: string | null
  class: string
  currency: string
  qty: number
  avg_price: number
  last_price: number | null
  invested: number
  market_value: number
  unrealized_pnl: number
}

export async function getPositions() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('v_positions')
    .select('asset_id, ticker, name, class, currency, qty, avg_price, last_price, invested, market_value, unrealized_pnl')
    .eq('user_id', user.id)
    .order('market_value', { ascending: false })

  if (error) {
    console.error('[investments] getPositions error', error)
    return []
  }
  return (data ?? []) as Position[]
}

export async function getAssets() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('assets')
    .select('id, ticker, name, class')
    .eq('user_id', user.id)
    .order('ticker')

  if (error) {
    console.error('[investments] getAssets error', error)
    return []
  }
  return data ?? []
}

export async function getInvestmentAccounts() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('accounts')
    .select('id, name')
    .eq('user_id', user.id)
    .eq('type', 'investment')
    .order('name')

  if (error) {
    console.error('[investments] getInvestmentAccounts error', error)
    return []
  }
  return data ?? []
}
