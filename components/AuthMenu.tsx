'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthMenu() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setEmail(data.user?.email ?? null)
    })
    return () => { mounted = false }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  if (!email) {
    return (
      <a
        href="/login"
        className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50"
      >
        Entrar
      </a>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden md:inline text-sm text-neutral-600">{email}</span>
      <button
        onClick={signOut}
        className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50"
      >
        Sair
      </button>
    </div>
  )
}
