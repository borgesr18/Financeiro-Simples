// app/signup/page.tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signUpAction } from './actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function SignUpPage({
  searchParams,
}: {
  searchParams?: { error?: string; redirectTo?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Se já está logado, só mostra uma mensagem simples
  if (user) {
    return (
      <main className="p-6">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="mb-4">Você já está logado.</p>
          <Link href="/" className="px-4 py-2 bg-primary-500 text-white rounded-lg">
            Ir para o dashboard
          </Link>
        </div>
      </main>
    )
  }

  const error = searchParams?.error
  const redirectTo = searchParams?.redirectTo ?? '/'

  return (
    <main className="p-6">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-card p-6">
        <h1 className="text-xl font-semibold mb-4">Criar conta</h1>

        {error && (
          <div className="mb-3 text-sm rounded border border-rose-300 bg-rose-50 px-3 py-2 text-rose-800">
            {error}
          </div>
        )}

        <form action={signUpAction} className="space-y-3">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div>
            <label className="block text-sm mb-1">E-mail</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded border px-3 py-2"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Senha</label>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full rounded border px-3 py-2"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg">
            Criar conta
          </button>

          <p className="mt-3 text-sm text-neutral-500">
            Já tem uma conta?{' '}
            <Link href="/login" className="text-primary-600 hover:underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
