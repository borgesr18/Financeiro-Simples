// lib/supabase/server.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Somente leitura no render de RSC
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        // Bloqueia/ignora sets no render para evitar o erro
        set() {
          // NOOP em RSC (Next não permite cookies.set aqui)
        },
        remove() {
          // NOOP em RSC
        },
      },
    }
  )
}


