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
  // usamos "kind" na UI, mas enviaremos também a coluna "type" do banco
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

    // Convenção: despesa = negativo, receita = positivo
    const signedAmount =
      values.kind === 'expense' ? -Math.abs(values.amount) : Math.abs(values.amount)

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      description: values.description,
      date: values.date,
      amount: signedAmount,
      category_id: values.category_id,
      account_id: values.account_id,
      type: values.kind,              // 🔧 ESSENCIAL: popula a coluna NOT NULL do banco
    })

    if (error) {
      setErrorMsg(error.message)
      return
    }

    reset()
    router.push('/')   // ajuste se sua lista estiver em outra rota
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
          <input type="dat

