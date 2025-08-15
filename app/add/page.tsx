'use client'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { createClient } from '@/lib/supabase/browser'

const schema = z.object({
  amount: z.string().min(1),
  date: z.string().min(1),
  description: z.string().min(1),
  account_id: z.string().uuid(),
  category_id: z.string().uuid(),
})

type FormData = z.infer<typeof schema>

export default function AddPage() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: new Date().toISOString().slice(0,10),
    }
  })
  const supabase = createClient()
  const [accounts, setAccounts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      const [{ data: acc }, { data: cat }] = await Promise.all([
        supabase.from('accounts').select('id,name'),
        supabase.from('categories').select('id,name')
      ])
      setAccounts(acc ?? [])
      setCategories(cat ?? [])
    })()
  }, [])

  async function onSubmit(values: FormData) {
    // amount string -> number; negative for expense if user enters "-"
    const amount = parseFloat(values.amount.replace(',', '.'))
    const { error } = await supabase.from('transactions').insert({
      amount,
      date: values.date,
      description: values.description,
      account_id: values.account_id,
      category_id: values.category_id,
    })
    if (!error) {
      reset({ amount: '', description: '', account_id: '', category_id: '', date: new Date().toISOString().slice(0,10) })
      alert('Lançamento criado!')
    } else {
      alert('Erro: ' + error.message)
    }
  }

  return (
    <main className="card max-w-xl">
      <h1>Novo lançamento</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
        <div><label className="label">Valor (use negativo para despesa)</label><input className="input w-full" {...register('amount')} placeholder="-45.90" /></div>
        <div><label className="label">Data</label><input className="input w-full" type="date" {...register('date')} /></div>
        <div><label className="label">Descrição</label><input className="input w-full" {...register('description')} placeholder="mercado, salário..." /></div>
        <div><label className="label">Conta</label>
          <select className="select w-full" {...register('account_id')}>
            <option value="">Selecione...</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div><label className="label">Categoria</label>
          <select className="select w-full" {...register('category_id')}>
            <option value="">Selecione...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <button className="btn" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar'}</button>
        <p className="text-rose-400 text-sm">{Object.values(errors).map(e => e.message).join(', ')}</p>
      </form>
    </main>
  )
}
