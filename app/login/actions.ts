'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function signInAction(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '/')

  // Validação simples
  if (!email || !password) {
    redirect(
      `/login?error=${encodeURIComponent('Informe e-mail e senha')}&redirectTo=${encodeURIComponent(redirectTo)}`
    )
  }

  // Ação de servidor: aqui podemos manipular cookies com segurança
  const cookieStore = cookies()
  const supabase = createServerClient(
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
          cookieStore.set({ name, value: '', expires: new Date(0), ...options })
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) {
    // Em caso de erro, redireciona de volta ao /login com mensagem
    redirect(
      `/login?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`
    )
  }

  // Sucesso: redireciona para a rota de destino
  redirect(redirectTo)
}
