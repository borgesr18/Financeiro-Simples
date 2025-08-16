// components/BudgetForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const schema = z.object({
  category_id: z.string().min(1, 'Selecione a categoria'),
  year: z.coerce.number().min(2000),
  month: z.coerce.number().min(1).max(12),
  amount: z.coerce.number().positive(),
})

type FormData = z.infer<typeof schema>

export default function BudgetForm({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    },
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(data: FormData) {
    setErrorMsg(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('Sessão expirada, faça login novamente.')
      return
    }

    const y = Number(data.year)
    const m = Number(data.month)
    const period = `${y}-${String(m).padStart(2, '0')}`
    const catName = categories.find(c => c.id === data.category_id)?.name ?? null

    // Tenta esquema year/month primeiro
    let errorYM: any = null
    {
      const { error } = await supabase
        .from('budgets')
        .upsert(
          {
            user_id: user.id,
            category_id: data.category_id,
            category: catName,           // compat se coluna textual for NOT NULL
            year: y,
            month: m,
            amount: Number(data.amount),
          },
          { onConflict: 'user_id,year,month,category_id' }
        )
      if (error) errorYM = error
    }

    // Se year/month não existir, tenta period
    if (errorYM && (errorYM.code === '42703' || /column .* does not exist/i.test(errorYM.message ?? ''))) {
      const { error: e2 } = await supabase
        .from('budgets')
        .upsert(
          {
            user_id: user.id,
            category_id: data.category_id,
            category: catName,           // compat
            period,
            amount: Number(data.amount),
          },
          { onConflict: 'user_id,period,category_id' }
        )
      if (e2) {
        setErrorMsg(e2.message)
        return
      }
    } else if (errorYM) {
      setErrorMsg(errorYM.message)
      return
    }

    reset()
    router.push('/budget')   // <- volta para a lista
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Categoria</label>
        <select
          {...register('category_id')}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">Selecione...</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category_id && <p className="text-sm text-red-600">{errors.category_id.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Ano</label>
          <input type="number" {...register('year')} className="w-full rounded border px-3 py-2" />
          {errors.year && <p className="text-sm text-red-600">{errors.year.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Mês</label>
          <input type="number" min={1} max={12} {...register('month')} className="w-full rounded border px-3 py-2" />
          {errors.month && <p className="text-sm text-red-600">{errors.month.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Valor planejado (R$)</label>
        <input type="number" step="0.01" {...register('amount')} className="w-full rounded border px-3 py-2" />
        {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-sky-500 text-white rounded-lg">
        {isSubmitting ? 'Salvando...' : 'Salvar orçamento'}
      </button>
    </form>
  )
}


