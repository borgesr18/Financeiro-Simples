'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '/')

  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent('Informe e-mail e senha')}&redirectTo=${encodeURIComponent(redirectTo)}`
    )
  }

  const cookieStore = cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(
          name: string,
          value: string,
          options?: Parameters<typeof cookieStore.set>[1]
        ) {
          // Evita spread de valor possivelmente undefined
          if (options) {
            cookieStore.set({ name, value, ...options })
          } else {
            cookieStore.set({ name, value })
          }
        },
        remove(
          name: string,
          options?: Parameters<typeof cookieStore.set>[1]
        ) {
          const base = { name, value: '', expires: new Date(0) }
          if (options) {
            cookieStore.set({ ...base, ...options })
          } else {
            cookieStore.set(base)
          }
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`
    )
  }

  redirect(redirectTo)
}

