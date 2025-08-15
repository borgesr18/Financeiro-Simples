import { createClient } from '@/lib/supabase/server'

export async function getUserCategories() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, color, icon')
    .order('name', { ascending: true })
  if (error) {
    console.error('getUserCategories error:', error)
    return []
  }
  return data ?? []
}
