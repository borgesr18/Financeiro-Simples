// components/admin/AdminToggleButton.tsx
'use client'

import { useState } from 'react'

export function AdminToggleButton({
  userId,
  isAdmin,
}: {
  userId: string
  isAdmin: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function onClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/toggle-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, isAdmin: !isAdmin }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.error ?? 'Falha ao atualizar')
      // Atualiza a página para refletir a mudança
      window.location.reload()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-3 py-1.5 rounded-lg border ${
        isAdmin
          ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
          : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
      } disabled:opacity-60`}
      title={isAdmin ? 'Remover permissão de administrador' : 'Conceder permissão de administrador'}
    >
      {loading ? '…' : isAdmin ? 'Remover admin' : 'Tornar admin'}
    </button>
  )
}
