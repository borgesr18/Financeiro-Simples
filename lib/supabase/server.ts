// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient as createSSRClient, type CookieOptions } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    // Log amigável para detectar isso rápido em produção
    console.error('[supabase] Faltam variáveis NEXT_PUBLIC_SUPABASE_URL/ANON_KEY no ambiente.')
    throw new Error('Supabase: variáveis de ambiente ausentes')
  }

  const store = cookies()
  return createSSRClient(url, anon, {
    cookies: {
      get(name: string) {
        return store.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try { store.set({ name, value, ...options }) } catch {}
      },
      remove(name: string, options: CookieOptions) {
        try { store.set({ name, value: '', ...options }) } catch {}
      },
    },
  })
}
