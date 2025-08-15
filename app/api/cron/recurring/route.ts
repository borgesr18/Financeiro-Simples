import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export async function GET() {
  // This endpoint is intended for Vercel Cron. It uses a Service Role key (server-only).
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const today = new Date().toISOString().slice(0,10)

  // find due rules
  const { data: rules, error } = await supabase
    .from('recurring_rules')
    .select('id,user_id,account_id,category_id,description,amount,next_date,frequency,auto_post')
    .lte('next_date', today)

  if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 })

  let created = 0
  for (const r of rules ?? []) {
    if (r.auto_post) {
      await supabase.from('transactions').insert({
        user_id: r.user_id,
        account_id: r.account_id,
        category_id: r.category_id,
        description: r.description,
        amount: r.amount,
        date: r.next_date
      })
      created++
    }
    // advance next_date
    const next = new Date(r.next_date)
    if (r.frequency === 'monthly') next.setMonth(next.getMonth() + 1)
    if (r.frequency === 'weekly') next.setDate(next.getDate() + 7)
    if (r.frequency === 'yearly') next.setFullYear(next.getFullYear() + 1)
    await supabase.from('recurring_rules').update({ next_date: next.toISOString().slice(0,10) }).eq('id', r.id)
  }

  return NextResponse.json({ ok:true, processed: rules?.length ?? 0, created })
}
