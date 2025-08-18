// lib/auth.ts
import { createClient } from '@/lib/supabase/server'

/**
 * Garante usuário autenticado e NÃO suspenso.
 * - Lança { code: 'UNAUTHENTICATED' } se não logado
 * - Lança { code: 'SUSPENDED' } se profiles.is_suspended = true
 * - Tolera ambientes sem tabela `profiles`
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
    // Se não existir a tabela `profiles`, não bloqueia aqui.
  }

  return { supabase, user }
}
