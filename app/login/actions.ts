// app/login/actions.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createActionClient } from '@/lib/supabase/actions'

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') || '')
  const password = String(formData.get('password') || '')
  const redirectTo = String(formData.get('redirectTo') || '/')

  const supabase = createActionClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { ok: false, message: error.message }
  }

  // Cookies foram setados com sucesso via actions client
  revalidatePath('/') // opcional
  redirect(redirectTo || '/')
}
