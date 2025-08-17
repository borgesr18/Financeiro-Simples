// lib/authz.ts
import { createClient } from '@/lib/supabase/server'

export async function getSessionUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

export async function isAdmin() {
  const user = await getSessionUser()
  const role =
    (user?.app_metadata as any)?.role ??
    (user?.user_metadata as any)?.role ??
    null
  return role === 'admin'
}
