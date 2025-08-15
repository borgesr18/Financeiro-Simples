// app/settings/categories/page.tsx
export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  FaUtensils,
  FaCar,
  FaBolt,
  FaPiggyBank,
  FaCartShopping, // <- corrigido
  FaHeart,
  FaGraduationCap,
  FaHouse,
} from 'react-icons/fa6'

type Category = {
  id: string
  name: string
  color: string | null
  icon: string | null
}

const ICON_OPTIONS = [
  { slug: 'utensils', label: 'Alimentação', Comp: FaUtensils },
  { slug: 'car',      label: 'Transporte',  Comp: FaCar },
  { slug: 'bolt',     label: 'Energia',     Comp: FaBolt },
  { slug: 'piggy',    label: 'Poupança',    Comp: FaPiggyBank },
  { slug: 'cart',     label: 'Compras',     Comp: FaCartShopping }, // <- corrigido
  { slug: 'heart',    label: 'Saúde',       Comp: FaHeart },
  { slug: 'grad',     label: 'Educação',    Comp: FaGraduationCap },
  { slug: 'home',     label: 'Casa',        Comp: FaHouse },
] as const

function resolveIcon(slug?: string | null) {
  const found = ICON_OPTIONS.find(i => i.slug === slug)
  return (found?.Comp ?? FaCartShopping) // <- fallback corrigido
}

async function getData() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null as any, categories: [] as Category[] }

  const { data, error } = await supabase
    .from('categories')
    .select('id, name, color, icon')
    .eq('user_id', user.id)
    .order('name')

  if (error) {
    return { user, categories: [] as Category[] }
  }
  return { user, categories: (data ?? []) as Category[] }
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

  // server actions wrappers
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

        {/* Formulário de criação (nome + cor + ícone) */}
        <form action={doCreate} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs text-neutral-600 mb-1">Nome</label>
            <input
              name="name"
              placeholder="Ex.: Alimentação"
              className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">Cor</label>
            <input
              type="color"
              name="color"
              defaultValue="#6b7280"
              className="h-[42px] w-full rounded-lg border px-1"
            />
          </div>

          <div>
            <label className="block text-xs text-neutral-600 mb-1">Ícone</label>
            <select
              name="icon"
              className="w-full px-3 py-2 border rounded-lg bg-neutral-50"
              defaultValue=""
            >
              <option value="">(sem ícone)</option>
              {ICON_OPTIONS.map(opt => (
                <option key={opt.slug} value={opt.slug}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <button className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg">
              Adicionar
            </button>
          </div>
        </form>

        {/* Lista */}
        <ul className="divide-y">
          {categories.map((c) => {
            const Icon = resolveIcon(c.icon ?? undefined)
            const color = c.color ?? '#64748b'
            return (
              <li key={c.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium"
                    style={{ backgroundColor: `${color}20`, color }}
                    title={c.name}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c.name}
                  </span>
                </div>
                <form action={doDelete}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="text-sm text-red-600 hover:underline">Excluir</button>
                </form>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}

