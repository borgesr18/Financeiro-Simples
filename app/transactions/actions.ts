'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function createTransaction(fd: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const payload = {
    user_id: user.id,
    date: String(fd.get('date')),
    description: String(fd.get('description') ?? '').trim(),
    amount: Number(fd.get('amount') ?? 0),
    type: String(fd.get('type')),             // 'income' | 'expense'
    category_id: String(fd.get('category_id') || ''),
  }

  // validação simples
  if (!payload.date || !payload.description || !payload.type || !payload.category_id) return

  const { error } = await supabase.from('transactions').insert(payload)
  if (error) console.error('createTransaction', error)

  revalidatePath('/transactions')
}
