// lib/supabase/admin.ts
import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function hasAdminKey() {
  return !!process.env.SUPABASE_SERVICE_ROLE_KEY && !!process.env.SUPABASE_URL
}

export function createAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('[admin] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausente')
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  })
}
