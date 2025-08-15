'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function TransactionRowActions({ id, onDeleted }: { id: string; onDeleted?: () => void }) {
  const [loading, setLoading] = useState(false)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleDelete() {
    if (!confirm('Excluir este lançamento? Esta ação não pode ser desfeita.')) return
    setLoading(true)
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', id)
      if (error) throw error
      onDeleted?.()
      // fallback: recarregar página caso não tenha callback
      if (!onDeleted) location.reload()
    } catch (e: any) {
      alert(e?.message ?? 'Erro ao excluir')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2 justify-end">
      <Link
        href={`/transactions/${id}/edit`}
        className="px-2 py-1 border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-50"
      >
        Editar
      </Link>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-2 py-1 border border-danger text-danger rounded hover:bg-red-50 disabled:opacity-60"
      >
        {loading ? 'Excluindo...' : 'Excluir'}
      </button>
    </div>
  )
}
