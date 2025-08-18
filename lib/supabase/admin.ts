// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

export function hasAdminKey(): boolean {
  return Boolean(url && serviceKey)
}

export function createAdminClient() {
  if (!hasAdminKey()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY ausente')
  }
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: { headers: { 'x-application-name': 'fintrack-admin' } },
  })
}
