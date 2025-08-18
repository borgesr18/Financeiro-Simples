// components/admin/SuspendButton.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function SuspendButton({
  userId,
  suspended,
}: {
  userId: string
  suspended: boolean
}) {
  const [pending, start] = useTransition()
  const [local, setLocal] = useState(suspended)
  const router = useRouter()

  const onClick = () => {
    start(async () => {
      try {
        const res = await fetch('/api/admin/users/suspend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, suspend: !local }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Falha ao atualizar status')
        setLocal(!local)
        router.refresh()
      } catch (e: any) {
        alert(e.message || 'Erro ao alterar suspensão')
      }
    })
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`px-3 py-1.5 rounded-lg border ${local
        ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
        : 'border-neutral-300 text-neutral-700 hover:bg-neutral-50'
      }`}
      title={local ? 'Reativar usuário' : 'Suspender usuário'}
    >
      {pending ? '...' : local ? 'Reativar' : 'Suspender'}
    </button>
  )
}
