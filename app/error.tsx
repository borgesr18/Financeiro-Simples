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
    // Isso aparece no console do servidor (Functions logs na Vercel)
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html>
      <body className="p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <h2 className="text-lg font-semibold mb-2">Ops! Ocorreu um erro.</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Código de diagnóstico:{' '}
            <code className="px-2 py-1 bg-neutral-100 rounded">
              {error.digest ?? '—'}
            </code>
          </p>
          <button
            onClick={() => reset()}
            className="px-3 py-2 bg-primary-500 text-white rounded hover:bg-primary-600"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  )
}

