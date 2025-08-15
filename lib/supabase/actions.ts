// app/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createActionClient } from '@/lib/supabase/actions'

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '/')

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent('Informe e-mail e senha')}&redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  try {
    const supabase = createActionClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      redirect(
        `/login?error=${encodeURIComponent(error.message)}&redirectTo=${encodeURIComponent(redirectTo)}`
      )
    }

    // sucesso
    redirect(redirectTo)
  } catch (e: any) {
    const msg = e?.message ?? 'Falha ao entrar'
    redirect(`/login?error=${encodeURIComponent(msg)}&redirectTo=${encodeURIComponent(redirectTo)}`)
  }
}
