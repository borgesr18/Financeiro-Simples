import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { signInAction } from './actions'

// Se você usa leitura de searchParams, mantenha o runtime Node
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { error?: string; redirectTo?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const redirectTo = searchParams?.redirectTo || '/'
  const errorMsg = searchParams?.error

  if (user) {
    // Usuário já logado — UX: link para seguir ou deslogar em settings
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-card p-6 space-y-4">
          <h2 className="text-xl font-semibold">Você já está logado</h2>
          <div className="flex gap-3">
            <Link
              href={redirectTo}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Continuar
            </Link>
            <Link
              href="/settings"
              className="px-4 py-2 bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50"
            >
              Configurações
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Entrar</h2>

        {errorMsg && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        {/* IMPORTANTE: a Server Action NÃO retorna objeto; só redirect/void */}
        <form action={signInAction} className="space-y-4">
          <input type="hidden" name="redirectTo" value={redirectTo} />

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm text-neutral-600">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              placeholder="voce@exemplo.com"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm text-neutral-600">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-100"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
          >
            Entrar
          </button>

          <p className="mt-3 text-sm text-neutral-500">
            Ainda não tem conta?{' '}
            <Link href="/signup" className="text-primary-600 hover:underline">
              Criar conta
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}

