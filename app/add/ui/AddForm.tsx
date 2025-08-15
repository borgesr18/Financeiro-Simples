// app/add/ui/AddForm.tsx
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

const schema = z.object({
  date: z.string().min(1, 'Informe a data'),
  description: z.string().min(2, 'Descreva o lançamento'),
  amount: z.coerce.number().positive('Informe um valor positivo'),
  type: z.enum(['income', 'expense']),
  category_id: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

export default function AddForm({
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
      type: 'expense',
      date: new Date().toISOString().slice(0, 10),
    },
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(data: FormData) {
    setErrorMsg(null)

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      setErrorMsg('Sessão expirada. Faça login novamente.')
      return
    }

    const payload = {
      user_id: user.id,
      date: data.date, // sua tabela usa coluna "date"
      description: data.description,
      amount: data.amount, // mantemos positivo; relatórios já tratam por tipo
      type: data.type,
      category_id: data.category_id ?? null,
    }

    const { error } = await supabase.from('transactions').insert(payload)
    if (error) {
      setErrorMsg(error.message)
      return
    }

    reset()
    router.push('/transactions')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Data</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            {...register('date')}
          />
          {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <select
            className="w-full rounded border px-3 py-2"
            {...register('type')}
          >
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
          {errors.type && <p className="text-sm text-red-600">{errors.type.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Descrição</label>
        <input
          type="text"
          placeholder="Ex.: Supermercado"
          className="w-full rounded border px-3 py-2"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded border px-3 py-2"
            {...register('amount')}
          />
          {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Categoria (opcional)</label>
          <select
            className="w-full rounded border px-3 py-2"
            {...register('category_id')}
            defaultValue=""
          >
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.category_id && (
            <p className="text-sm text-red-600">{errors.category_id.message}</p>
          )}
        </div>
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-primary-500 text-white rounded-lg"
      >
        {isSubmitting ? 'Salvando...' : 'Adicionar lançamento'}
      </button>
    </form>
  )
}

