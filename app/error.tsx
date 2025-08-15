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
    console.error('GlobalError:', { message: error.message, digest: error.digest, stack: error.stack })
  }, [error])

  return (
    <html>
      <body className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white border border-neutral-200 rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-semibold text-neutral-800 mb-2">Algo deu errado</h2>
          <p className="text-sm text-neutral-600 mb-3">
            Tente novamente. Se o problema persistir, me envie o <strong>digest</strong> abaixo.
          </p>
          {error.digest && (
            <div className="text-xs font-mono bg-neutral-50 border border-neutral-200 rounded p-3 mb-3 break-all">
              digest: {error.digest}
            </div>
          )}
          <button
            onClick={() => reset()}
            className="px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}
