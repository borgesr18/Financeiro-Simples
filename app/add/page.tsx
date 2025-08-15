// app/add/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import AddForm from './ui/AddForm'

export default async function AddPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para lançar transações.</p>
        </div>
      </main>
    )
  }

  // Carrega categorias do usuário para o select do formulário
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id)
    .order('name')

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Novo lançamento</h2>
        <AddForm categories={categories ?? []} />
      </div>
    </main>
  )
}
