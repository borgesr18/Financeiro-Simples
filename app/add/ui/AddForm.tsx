'use client'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const schema = z.object({
  date: z.string().min(1, 'Informe a data'),
  description: z.string().min(2, 'Descrição muito curta'),
  amount: z.coerce.number().positive('Informe um valor maior que zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().optional().nullable(),
})
type FormData = z.infer<typeof schema>

export default function AddForm() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [err, setErr] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0, 10),
      type: 'expense',
    }
  })

  async function onSubmit(data: FormData) {
    setErr(null)
    try {
      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr || !user) throw new Error('Sessão expirada. Faça login novamente.')

      // Converte sinal: expense negativo, income positivo
      const amount = data.type === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount)

      const payload = {
        date: data.date,
        description: data.description,
        amount,
        category: data.category ?? null,
        type: data.type,
        // não precisa enviar user_id — a trigger no DB preenche com auth.uid()
      }

      const { error } = await supabase.from('transactions').insert(payload)
      if (error) throw error

      reset()
      router.replace('/transactions')
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? 'Erro ao salvar')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm text-neutral-600 mb-1">Data</label>
        <input type="date" className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('date')} />
        {errors.date && <p className="text-danger text-sm mt-1">{errors.date.message}</p>}
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Descrição</label>
        <input type="text" className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('description')} />
        {errors.description && <p className="text-danger text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Valor</label>
          <input
            type="number"
            step="0.01"
            className="w-full border border-neutral-200 rounded-lg px-3 py-2"
            {...register('amount', { valueAsNumber: true })}
          />
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
        <input type="text" className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('category')} />
      </div>

      {err && <div className="text-danger text-sm">{err}</div>}

      <div className="pt-2 flex gap-2">
        <button disabled={isSubmitting} className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60">
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={() => history.back()} className="px-4 py-2 bg-white border border-neutral-200 rounded-lg">
          Cancelar
        </button>
      </div>
    </form>
  )
}
