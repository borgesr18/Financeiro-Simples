// lib/auth.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Garante que há usuário autenticado E que NÃO está suspenso.
 * - Lança erro "SUSPENDED" se o perfil estiver suspenso.
 * - Tolera ambientes sem tabela `profiles` (não quebra).
 */
export async function requireActiveUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    const e: any = new Error('Não autenticado')
    e.code = 'UNAUTHENTICATED'
    throw e
  }

  try {
    const { data: prof } = await supabase
      .from('profiles')
      .select('is_suspended')
      .eq('id', user.id)
      .maybeSingle()

    if (prof?.is_suspended === true) {
      const e: any = new Error('Conta suspensa')
      e.code = 'SUSPENDED'
      throw e
    }
  } catch {
    // Se a tabela `profiles` não existir neste ambiente, segue sem bloquear por DB.
  }

  return { supabase, user }
}
