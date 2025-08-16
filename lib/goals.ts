// lib/goals.ts
import { createClient } from '@/lib/supabase/server'

export type Goal = {
  id: string
  name: string
  target_amount: number
  due_date: string | null
  color_hex: string | null
  icon_slug: string | null
  status: 'active' | 'paused' | 'done' | 'archived'
}

export type GoalWithProgress = Goal & {
  current_amount: number
  percent: number
}

export async function getGoalsWithProgress(): Promise<GoalWithProgress[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: goals, error: gErr } = await supabase
    .from('goals')
    .select('id, name, target_amount, due_date, color_hex, icon_slug, status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (gErr) throw new Error(gErr.message)
  const list = (goals ?? []) as any[]

  if (list.length === 0) return []

  const ids = list.map(g => g.id)
  const { data: contribs, error: cErr } = await supabase
    .from('goal_contributions')
    .select('goal_id, amount')
    .eq('user_id', user.id)
    .in('goal_id', ids)

  if (cErr) throw new Error(cErr.message)

  const sumByGoal = new Map<string, number>()
  for (const c of contribs ?? []) {
    const k = c.goal_id as string
    sumByGoal.set(k, (sumByGoal.get(k) ?? 0) + Number(c.amount || 0))
  }

  return list.map(g => {
    const current = sumByGoal.get(g.id) ?? 0
    const target = Number(g.target_amount) || 0
    return {
      id: g.id,
      name: g.name,
      target_amount: target,
      due_date: g.due_date,
      color_hex: g.color_hex,
      icon_slug: g.icon_slug,
      status: g.status,
      current_amount: current,
      percent: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    }
  })
}

export async function getGoalDetail(id: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: goal } = await supabase
    .from('goals')
    .select('id, name, target_amount, due_date, color_hex, icon_slug, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!goal) return null

  const { data: contribs } = await supabase
    .from('goal_contributions')
    .select('id, date, amount, notes')
    .eq('user_id', user.id)
    .eq('goal_id', id)
    .order('date', { ascending: false })

  const current = (contribs ?? []).reduce((acc, c) => acc + Number(c.amount || 0), 0)

  return { goal, contribs: contribs ?? [], current }
}
