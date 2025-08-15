// app/add/page.tsx
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { createClient } from '@/lib/supabase/server'
import AddForm from './ui/AddForm'
import Link from 'next/link'

export default async function AddPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Se não estiver logado, manda para o login preservando redirect
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="text-neutral-700 mb-4">Você precisa estar logado para criar lançamentos.</p>
          <Link
            href={`/login?redirectTo=${encodeURIComponent('/add')}`}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Ir para login
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Novo lançamento</h2>
        <AddForm />
      </div>
    </main>
  )
}

