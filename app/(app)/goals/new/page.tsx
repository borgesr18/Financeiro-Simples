// app/(app)/goals/new/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import GoalForm from '@/components/GoalForm'

export default async function NewGoalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para cadastrar metas.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Nova meta</h2>
        <GoalForm />
      </div>
    </main>
  )
}
