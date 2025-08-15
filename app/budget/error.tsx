// app/budgets/error.tsx
'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function BudgetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    // Loga no console do navegador e aparece nos logs do Vercel também
    console.error('Budgets error:', error)
  }, [error])

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
        <h2 className="text-xl font-semibold">Não foi possível carregar Orçamentos</h2>
        <p className="text-neutral-600">
          Ocorreu um erro durante o carregamento. Tente novamente. <br />
          <span className="text-xs text-neutral-400">Digest: {error?.digest ?? 'n/d'}</span>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => reset()} // tenta novo render do server component
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Tentar novamente
          </button>
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 bg-white border border-neutral-200 rounded-lg"
          >
            Recarregar
          </button>
          <Link href="/" className="px-4 py-2 bg-white border border-neutral-200 rounded-lg">
            Ir ao início
          </Link>
        </div>
      </div>
    </main>
  )
}
