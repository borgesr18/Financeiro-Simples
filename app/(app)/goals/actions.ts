// app/(app)/goals/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createActionClient } from '@/lib/supabase/actions'

export async function deleteGoal(formData: FormData) {
  const id = String(formData.get('id') ?? '')
  if (!id) return

  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('goals').delete().eq('id', id).eq('user_id', user.id)
  revalidatePath('/goals')
}

export async function addContribution(formData: FormData) {
  const supabase = createActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const goal_id = String(formData.get('goal_id') ?? '')
  const amount = Number(formData.get('amount') ?? 0)
  const date = String(formData.get('date') ?? '')
  const notes = String(formData.get('notes') ?? '')

  if (!goal_id || !amount) return

  const payload: any = { user_id: user.id, goal_id, amount }
  if (date) payload.date = date
  if (notes) payload.notes = notes

  const { error } = await supabase.from('goal_contributions').insert(payload)
  if (error) throw new Error(error.message)

  revalidatePath(`/goals/${goal_id}`)
}
