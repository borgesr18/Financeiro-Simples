'use client'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

const schema = z.object({
  category: z.string().min(2, 'Informe uma categoria'),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000),
  amount: z.coerce.number().min(0, 'Valor deve ser ≥ 0'),
})

type FormData = z.infer<typeof schema>

export type BudgetInitial = {
  id?: string
  category?: string
  month?: number
  year?: number
  amount?: number
}

export default function BudgetForm({ initial }: { initial?: BudgetInitial }) {
  const router = useRouter()
  const qs = useSearchParams()

  const today = useMemo(() => new Date(), [])
  const m0 = Number(qs.get('month')) || (initial?.month ?? today.getMonth() + 1)
  const y0 = Number(qs.get('year')) || (initial?.year ?? today.getFullYear())

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: initial?.category ?? '',
      month: m0,
      year: y0,
      amount: initial?.amount ?? 0,
    }
  })

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(data: FormData) {
    setErr(null)
    try {
      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr || !user) throw new Error('Sessão expirada. Faça login novamente.')

      if (initial?.id) {
        // EDITAR
        const { error } = await supabase
          .from('budgets')
          .update({
            category: data.category,
            month: data.month,
            year: data.year,
            amount: data.amount,
          })
          .eq('id', initial.id)
        if (error) throw error
      } else {
        // CRIAR — upsert por (user_id,category,month,year)
        const { error } = await supabase
          .from('budgets')
          .upsert({
            category: data.category,
            month: data.month,
            year: data.year,
            amount: data.amount,
          }, { onConflict: 'user_id,category,month,year' })
        if (error) throw error
      }

      reset()
      router.replace(`/budgets?year=${data.year}&month=${data.month}`)
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? 'Erro ao salvar meta')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm text-neutral-600 mb-1">Categoria</label>
        <input
          type="text"
          className="w-full border border-neutral-200 rounded-lg px-3 py-2"
          placeholder="Ex.: Alimentação"
          {...register('category')}
        />
        {errors.category && <p className="text-danger text-sm mt-1">{errors.category.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Mês</label>
          <select className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('month')}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m.toString().padStart(2,'0')}</option>
            ))}
          </select>
          {errors.month && <p className="text-danger text-sm mt-1">{errors.month.message}</p>}
        </div>
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Ano</label>
          <input type="number" className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('year')} />
          {errors.year && <p className="text-danger text-sm mt-1">{errors.year.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm text-neutral-600 mb-1">Meta (R$)</label>
        <input
          type="number"
          step="0.01"
          className="w-full border border-neutral-200 rounded-lg px-3 py-2"
          {...register('amount', { valueAsNumber: true })}
        />
        {errors.amount && <p className="text-danger text-sm mt-1">{errors.amount.message}</p>}
      </div>

      {err && <div className="text-danger text-sm">{err}</div>}

      <div className="pt-2 flex gap-2">
        <button
          disabled={isSubmitting}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60"
        >
          {isSubmitting ? 'Salvando...' : (initial?.id ? 'Salvar alterações' : 'Criar meta')}
        </button>
        <button type="button" onClick={() => history.back()} className="px-4 py-2 bg-white border border-neutral-200 rounded-lg">
          Cancelar
        </button>
      </div>
    </form>
  )
}
