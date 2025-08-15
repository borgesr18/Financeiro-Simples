'use client'

import { useTransition } from 'react'

type Props = {
  action: (formData: FormData) => void | Promise<void>
  id: string
  year: number
  month: number
}

export default function DeleteBudgetForm({ action, id, year, month }: Props) {
  const [isPending, startTransition] = useTransition()

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm('Tem certeza que deseja excluir esta meta?')) e.preventDefault()
      }}
      className="pt-2"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="year" value={year} />
      <input type="hidden" name="month" value={month} />
      <button
        type="submit"
        disabled={isPending}
        className="text-red-600 text-sm hover:underline disabled:opacity-60"
      >
        {isPending ? 'Excluindo…' : 'Excluir meta'}
      </button>
    </form>
  )
}
