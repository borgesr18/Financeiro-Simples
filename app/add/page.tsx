// app/add/page.tsx
import { createClient } from '@/lib/supabase/server'
import AddForm from './ui/AddForm'

export default async function AddPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { /* ... como já está ... */ }

  const { data: categories } = await supabase
    .from('categories')
    .select('id,name')
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

