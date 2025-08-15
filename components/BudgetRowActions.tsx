'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useCallback, useMemo, useState } from 'react'

export default function BudgetRowActions({ id }: { id: string }) {
  const router = useRouter()
  const qs = useSearchParams()
  const y = qs.get('year')
  const m = qs.get('month')

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), [])

  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const onDelete = useCallback(async () => {
    setErr(null)
    setLoading(true)
    try {
      const { data: { user }, error: uerr } = await supabase.auth.getUser()
      if (uerr || !user) throw new Error('Sessão expirada. Faça login novamente.')

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      router.refresh()
    } catch (e: any) {
      setErr(e?.message ?? 'Erro ao excluir meta')
    } finally {
      setLoading(false)
    }
  }, [id, router, supabase])

  return (
    <div className="flex items-center gap-3">
      <Link
        href={`/budget/${id}/edit${y && m ? `?year=${y}&month=${m}` : ''}`} // <-- corrigido
        className="text-sm text-primary-600 hover:underline"
      >
        Editar
      </Link>
      <button
        onClick={onDelete}
        disabled={loading}
        className="text-sm text-danger hover:underline disabled:opacity-60"
      >
        Excluir
      </button>
      {err && <span className="text-xs text-danger">{err}</span>}
    </div>
  )
}

