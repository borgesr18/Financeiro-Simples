// app/global-error.tsx
'use client'

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  // Em produção, o Next oculta detalhes; log no client para facilitar navegação,
  // mas o que realmente ajuda são os logs do servidor que colocamos nos catch/console.error.
  console.error('[GlobalError]', error)
  return (
    <html>
      <body>
        <div style={{ padding: 24 }}>
          <h1>Ops! Ocorreu um erro.</h1>
          <p>Tente novamente. Se persistir, compartilhe o código de diagnóstico abaixo.</p>
          {error.digest && (
            <code style={{ background: '#f5f5f5', padding: 8, display: 'inline-block', marginTop: 8 }}>
              digest: {error.digest}
            </code>
          )}
        </div>
      </body>
    </html>
  )
}
