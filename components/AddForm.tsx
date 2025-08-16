// components/AddForm.tsx
'use client'

import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

type Category = { id: string; name: string }
type Account  = { id: string; name: string }

const schema = z.object({
  description: z.string().min(1, 'Descreva o lançamento'),
  date: z.string().min(1, 'Informe a data'),
  category_id: z.string().min(1, 'Selecione a categoria'),
  account_id: z.string().min(1, 'Selecione a conta'),
  amount: z.coerce.number().positive('Informe um valor > 0'),
  kind: z.enum(['expense', 'income']),
})

type FormData = z.infer<typeof schema>

export default function AddForm({
  categories,
  accounts,
}: {
  categories: Category[]
  accounts: Account[]
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
      date: new Date().toISOString().slice(0, 10),
      kind: 'expense',
    },
  })

  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(values: FormData) {
    setErrorMsg(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setErrorMsg('Sessão expirada. Faça login novamente.')
      return
    }

    // Mantemos convenção: despesa = negativo, receita = positivo
    const signedAmount = values.kind === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount)

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      description: values.description,
      date: values.date,
      amount: signedAmount,
      category_id: values.category_id,
      account_id: values.account_id,
    })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    reset()
    // Redirecione para a listagem de lançamentos (ajuste se sua lista for outra rota)
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div>
        <label className="block text-sm mb-1">Descrição</label>
        <input
          {...register('description')}
          className="w-full rounded border px-3 py-2"
          placeholder="Ex.: Mercado, salário, etc."
        />
        {errors.description && <p className="text-sm text-rose-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Data</label>
          <input type="date" {...register('date')} className="w-full rounded border px-3 py-2" />
          {errors.date && <p className="text-sm text-rose-600">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm mb-1">Tipo</label>
          <select {...register('kind')} className="w-full rounded border px-3 py-2">
            <option value="expense">Despesa</option>
            <option value="income">Receita</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm mb-1">Categoria</label>
          <select {...register('category_id')} className="w-full rounded border px-3 py-2">
            <option value="">Selecione...</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category_id && <p className="text-sm text-rose-600">{errors.category_id.message}</p>}
        </div>

        <div>
          <label className="block text-sm mb-1">Conta</label>
          <select {...register('account_id')} className="w-full rounded border px-3 py-2">
            <option value="">Selecione...</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          {errors.account_id && <p className="text-sm text-rose-600">{errors.account_id.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Valor (R$)</label>
        <input type="number" step="0.01" {...register('amount')} className="w-full rounded border px-3 py-2" />
        {errors.amount && <p className="text-sm text-rose-600">{errors.amount.message}</p>}
      </div>

      {errorMsg && <p className="text-sm text-rose-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="px-4 py-2 bg-sky-500 text-white rounded-lg"
      >
        {isSubmitting ? 'Salvando...' : 'Salvar lançamento'}
      </button>
    </form>
  )
}
