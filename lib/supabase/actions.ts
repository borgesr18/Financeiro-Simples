// lib/supabase/actions.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export function createActionClient() {
  // Este helper deve ser chamado DENTRO de uma Server Action.
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options?: Parameters<typeof cookieStore.set>[1]) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options?: Parameters<typeof cookieStore.set>[1]) {
          // cookies().delete não existe no App Router;
          // usamos set com expiração no passado.
          cookieStore.set({
            name,
            value: '',
            expires: new Date(0),
            ...options,
          })
        },
      },
    }
  )
}

