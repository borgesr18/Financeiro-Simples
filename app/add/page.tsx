'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createBrowserClient } from '@supabase/ssr'

const schema = z.object({
  date: z.string().min(1, 'Informe a data'),
  description: z.string().min(2, 'Descrição muito curta'),
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().optional().nullable(),
})

type FormData = z.infer<typeof schema>

export default function AddPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      type: 'expense',
    },
  })

  const onSubmit = async (data: FormData) => {
    setError(null)
    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) { setError('Sessão expirada. Faça login novamente.'); return }

    const amount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)

    const { error: insertErr } = await supabase.from('transactions').insert({
      user_id: user.id,
      date: data.date,
      description: data.description,
      amount,
      category: data.category ?? null,
      type: data.type,
    })

    if (insertErr) { setError(insertErr.message); return }

    reset()
    router.push('/transactions')
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Novo lançamento</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">Data</label>
            <input type="date" className="w-full border border-neutral-200 rounded-lg px-3 py-2"
              {...register('date')} />
            {errors.date && <p className="text-danger text-sm mt-1">{errors.date.message}</p>}
          </div>

          <div>
            <label className="block text-sm text-neutral-600 mb-1">Descrição</label>
            <input type="text" className="w-full border border-neutral-200 rounded-lg px-3 py-2"
              placeholder="Ex.: Mercado, Salário..." {...register('description')} />
            {errors.description && <p className="text-danger text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Valor</label>
              <input type="number" step="0.01" className="w-full border border-neutral-200 rounded-lg px-3 py-2"
                {...register('amount', { valueAsNumber: true })} />
              {errors.amount && <p className="text-danger text-sm mt-1">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Tipo</label>
              <select className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('type')}>
                <option value="expense">Saída</option>
                <option value="income">Entrada</option>
              </select>
              {errors.type && <p className="text-danger text-sm mt-1">{errors.type.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm text-neutral-600 mb-1">Categoria (opcional)</label>
            <input type="text" className="w-full border border-neutral-200 rounded-lg px-3 py-2"
              placeholder="Ex.: Alimentação, Moradia..." {...register('category')} />
          </div>

          {error && <div className="text-danger text-sm">{error}</div>}

          <div className="pt-2 flex gap-2">
            <button disabled={isSubmitting} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60">
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => history.back()} className="px-4 py-2 bg-white border border-neutral-200 rounded-lg">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
