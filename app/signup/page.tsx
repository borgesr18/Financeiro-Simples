// app/signup/page.tsx
export default function SignupLockedPage() {
  return (
    <main className="p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6 space-y-3">
        <h1 className="text-xl font-semibold">Cadastro desabilitado</h1>
        <p className="text-sm text-neutral-600">
          O cadastro neste sistema é feito somente por convite. Solicite acesso ao administrador.
        </p>
        <p className="text-sm">
          Já tem conta mas esqueceu a senha?{' '}
          <a href="/reset-password/request" className="text-primary-600 hover:underline">
            Redefinir senha
          </a>
        </p>
      </div>
    </main>
  )
}

