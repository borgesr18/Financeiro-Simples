// app/signup/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { createActionClient } from '@/lib/supabase/actions'

export async function signUpAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const redirectTo = String(formData.get('redirectTo') ?? '/')

  if (!email || !password) {
    redirect(
      `/signup?error=${encodeURIComponent('Informe e-mail e senha')}` +
      `&redirectTo=${encodeURIComponent(redirectTo)}`
    )
  }

  const supabase = createActionClient()
  const { error } = await supabase.auth.signUp({ email, password })

  if (error) {
    redirect(
      `/signup?error=${encodeURIComponent(error.message)}` +
      `&redirectTo=${encodeURIComponent(redirectTo)}`
    )
  }

  // Se o projeto exige confirmação por e-mail, a sessão pode não estar ativa ainda.
  redirect(
    `/login?success=${encodeURIComponent('Conta criada! Verifique seu e-mail e faça login.')}` +
    `&redirectTo=${encodeURIComponent(redirectTo)}`
  )
}
