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

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      category: initial?.category ?? '',
      month: m0,
      year: y0,
      amount: initial?.amount ?? 0,
    },
  })

  const [err, setErr] = useState<string | null>(null)

  async function onSubmit(data: FormData) {
    setErr(null)
    try {
      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr || !user) throw new Error('Sessão expirada. Faça login novamente.')

      if (initial?.id) {
        const { error } = await supabase
          .from('budgets')
          .update({
            category: data.category,
            month: data.month,
            year: data.year,
            amount: data.amount,
          })
          .eq('id', initial.id)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('budgets')
          .upsert({
            category: data.category,
            month: data.month,
            year: data.year,
            amount: data.amount,
            user_id: user.id,
          })
        if (error) throw error
      }

      reset()
      router.replace(`/budget?year=${data.year}&month=${data.month}`) // <-- corrigido
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? 'Erro ao salvar meta')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* ... resto inalterado (inputs/erros/botões) ... */}
    </form>
  )
}

