// app/login/page.tsx
import Link from 'next/link'
import { signInAction } from './actions'

export const dynamic = 'force-dynamic'

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { redirectTo?: string; error?: string }
}) {
  const redirectTo = searchParams?.redirectTo || '/'
  const errorMsg = searchParams?.error

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-neutral-800">Entrar</h1>
            <p className="text-neutral-500">
              Acesse sua conta para gerenciar seus gastos.
            </p>
          </div>

          {errorMsg ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {decodeURIComponent(errorMsg)}
            </div>
          ) : null}

          {/* Formulário: usa Server Action (pode setar cookies com segurança) */}
          <form action={signInAction} className="space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo} />

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium text-neutral-700">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-300"
                placeholder="voce@email.com"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-neutral-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 outline-none focus:border-primary-300 focus:ring-2 focus:ring-primary-300"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
            >
              Entrar
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm">
            <Link
              href="/"
              className="text-neutral-600 hover:text-neutral-800 hover:underline"
            >
              Voltar ao Dashboard
            </Link>
            <Link
              href="/signup"
              className="text-primary-600 hover:text-primary-700 hover:underline"
            >
              Criar conta
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-neutral-400">
          Protegido por autenticação Supabase.
        </p>
      </div>
    </main>
  )
}

