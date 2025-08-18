// components/SuspendedNotice.tsx
import { createClient } from '@/lib/supabase/server'

export default async function SuspendedNotice() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: prof } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .maybeSingle()

  if (!prof?.is_suspended) return null

  return (
    <div className="bg-rose-50 border-b border-rose-200 text-rose-700 px-4 py-2 text-sm">
      Sua conta está <strong>suspensa</strong>. Ações (criar/editar/excluir) estão bloqueadas. Fale com o administrador para reativar.
    </div>
  )
}
