// app/add/page.tsx
export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AddForm from '@/components/AddForm'

type Category = { id: string; name: string }
type Account = { id: string; name: string }

export default async function AddPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para lançar transações.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  const [{ data: categories }, { data: accounts }] = await Promise.all([
    supabase.from('categories').select('id, name').eq('user_id', user.id).order('name'),
    supabase.from('accounts').select('id, name').eq('user_id', user.id).eq('archived', false).order('created_at'),
  ])

  return (
    <main className="p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Novo lançamento</h2>
        <AddForm
          categories={(categories ?? []) as Category[]}
          accounts={(accounts ?? []) as Account[]}
        />
      </div>
    </main>
  )
}
