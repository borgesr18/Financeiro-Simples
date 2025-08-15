'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createBrowserClient } from '@supabase/ssr'

const schema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres').optional(),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const params = useSearchParams()
  const redirectTo = params.get('redirectTo') || '/'
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const [mode, setMode] = useState<'signin' | 'signup' | 'magic'>('signin')
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setMsg(null); setErr(null)
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password ?? '',
        })
        if (error) throw error
        router.replace(redirectTo)
        router.refresh()
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password ?? '',
          options: { emailRedirectTo: `${location.origin}` },
        })
        if (error) throw error
        setMsg('Conta criada! Verifique seu e-mail, se necessário, e faça login.')
        return
      }

      // magic link
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email: data.email,
          options: { emailRedirectTo: `${location.origin}` },
        })
        if (error) throw error
        setMsg('Enviamos um link de login para o seu e-mail.')
        return
      }
    } catch (e: any) {
      setErr(e?.message ?? 'Erro ao autenticar')
    }
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-card p-6">
        <h1 className="text-xl font-semibold mb-1">Acessar sua conta</h1>
        <p className="text-sm text-neutral-500 mb-4">Financeiro Simples</p>

        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1.5 rounded-lg text-sm border ${mode==='signin'?'bg-primary-50 text-primary-600 border-primary-200':'border-neutral-200'}`}
            onClick={() => setMode('signin')}
          >Entrar</button>
          <button
            className={`px-3 py-1.5 rounded-lg text-sm border ${mode==='signup'?'bg-primary-50 text-primary-600 border-primary-200':'border-neutral-200'}`}
            onClick={() => setMode('signup')}
          >Registrar</button>
          <button
            className={`px-3 py-1.5 rounded-lg text-sm border ${mode==='magic'?'bg-primary-50 text-primary-600 border-primary-200':'border-neutral-200'}`}
            onClick={() => setMode('magic')}
          >Link por e-mail</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className="block text-sm text-neutral-600 mb-1">E-mail</label>
            <input type="email" className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('email')} />
            {errors.email && <p className="text-danger text-sm mt-1">{errors.email.message}</p>}
          </div>

          {mode !== 'magic' && (
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Senha</label>
              <input type="password" className="w-full border border-neutral-200 rounded-lg px-3 py-2" {...register('password')} />
              {errors.password && <p className="text-danger text-sm mt-1">{errors.password.message}</p>}
            </div>
          )}

          {err && <div className="text-danger text-sm">{err}</div>}
          {msg && <div className="text-success text-sm">{msg}</div>}

          <button disabled={isSubmitting} className="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-60">
            {mode === 'signin' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
          </button>
        </form>

        <p className="text-xs text-neutral-500 mt-4">
          Dica: configure em Supabase &rarr; Authentication &rarr; URL de site como sua URL do Vercel para os links por e-mail.
        </p>
      </div>
    </main>
  )
}
