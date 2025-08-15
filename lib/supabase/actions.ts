// lib/supabase/actions.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * Helper para criar o client do Supabase em Server Actions,
 * permitindo o SDK escrever/ler cookies com segurança.
 *
 * IMPORTANTE: NÃO coloque "use server" aqui. O "use server" deve
 * ficar na action que chamar essa função, por ex.: app/login/actions.ts
 */
export function createActionClient() {
  const cookieStore = cookies()
  type CookieOptions = Parameters<typeof cookieStore.set>[2] // opções do set(name, value, options?)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: CookieOptions) {
          // assinatura posicional; sem spread quando options é undefined
          if (options) {
            cookieStore.set(name, value, options)
          } else {
            cookieStore.set(name, value)
          }
        },
        remove(name: string, options?: CookieOptions) {
          // expira o cookie sem usar spread com tipo possivelmente undefined
          const merged: CookieOptions = { expires: new Date(0) }
          if (options) Object.assign(merged, options)
          cookieStore.set(name, '', merged)
        },
      },
    }
  )
}
