// app/error.tsx
'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Isso aparece nos logs do browser e é coletado no Vercel (console.*)
    console.error('GlobalError:', { message: error.message, digest: error.digest, stack: error.stack })
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-xl shadow-card p-6 text-center">
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">Ops! Ocorreu um erro.</h2>
          <p className="text-sm text-neutral-600 mb-3">
            Tente novamente. Se persistir, compartilhe o código de diagnóstico abaixo.
          </p>
          {error.digest && (
            <div className="text-xs font-mono bg-neutral-100 rounded p-2 mb-4">
              digest: {error.digest}
            </div>
          )}
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}

