// components/admin/ResetPasswordButton.tsx
'use client'

import { useTransition } from 'react'

export default function ResetPasswordButton({ email }: { email: string | null }) {
  const [pending, start] = useTransition()

  const onClick = () => {
    if (!email) return alert('Usuário sem e-mail.')
    start(async () => {
      try {
        const res = await fetch('/api/admin/users/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Falha ao enviar e-mail')
        alert('E-mail de redefinição enviado.')
      } catch (e: any) {
        alert(e.message || 'Erro ao enviar e-mail de redefinição')
      }
    })
  }

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="px-3 py-1.5 rounded-lg border border-sky-300 text-sky-700 hover:bg-sky-50"
      title="Enviar e-mail de redefinição de senha"
    >
      {pending ? 'Enviando…' : 'Reset de senha'}
    </button>
  )
}
