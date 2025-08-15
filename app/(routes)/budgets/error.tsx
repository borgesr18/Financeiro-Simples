// app/budget/error.tsx  (ou app/budgets/error.tsx caso sua pasta seja /budgets)
'use client'

import { useEffect } from 'react'

export default function BudgetsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('BudgetsError:', { message: error.message, digest: error.digest, stack: error.stack })
  }, [error])

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-xl shadow-card p-6 text-center">
        <h2 className="text-lg font-semibold text-neutral-800 mb-2">Erro em Budgets</h2>
        {error.digest && (
          <div className="text-xs font-mono bg-neutral-100 rounded p-2 mb-4">
            digest: {error.digest}
          </div>
        )}
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          Recarregar seção
        </button>
      </div>
    </div>
  )
}
