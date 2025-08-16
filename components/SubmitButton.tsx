'use client'

import { useFormStatus } from 'react-dom'

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-60"
    >
      {pending ? 'Salvando…' : children}
    </button>
  )
}
