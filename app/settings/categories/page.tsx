export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

async function getData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, categories: [] }
  const { data } = await supabase.from('categories').select('id, name, color, icon').order('name')
  return { user, categories: data ?? [] }
}

export default async function CategoriesPage() {
  const { user, categories } = await getData()

  if (!user) {
    return (
      <main className="p-6">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Faça login para gerenciar categorias.</p>
          <Link href="/login" className="px-4 py-2 bg-primary-500 text-white rounded-lg">Ir para login</Link>
        </div>
      </main>
    )
  }

  // wrappers para as server actions (implemente-as em app/settings/categories/actions.ts)
  const doCreate = async (fd: FormData) => { 'use server'
    const { createCategory } = await import('./actions')
    await createCategory(fd)
  }
  const doDelete = async (fd: FormData) => { 'use server'
    const { deleteCategory } = await import('./actions')
    await deleteCategory(fd)
  }

  return (
    <main className="p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-6">
        <h2 className="text-xl font-semibold">Categorias</h2>

        <form action={doCreate} className="grid grid-cols-3 gap-3">
          <input name="name" placeholder="Nome" className="col-span-2 px-3 py-2 border rounded-lg bg-neutral-50" required />
          <button className="px-4 py-2 bg-primary-500 text-white rounded-lg">Adicionar</button>
        </form>

        <ul className="divide-y">
          {categories.map((c) => (
            <li key={c.id} className="py-2 flex items-center justify-between">
              <span>{c.name}</span>
              <form action={doDelete}>
                <input type="hidden" name="id" value={c.id} />
                <button className="text-sm text-red-600 hover:underline">Excluir</button>
              </form>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
