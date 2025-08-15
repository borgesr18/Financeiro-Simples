// app/transactions/[id]/edit/page.tsx
import { createClient } from '@/lib/supabase/server'
import EditForm from './ui/EditForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function EditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase.from('transactions').select('*').eq('id', params.id).single()

  if (error || !data) {
    return (
      <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
        <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
          <p className="text-danger mb-3">Lançamento não encontrado.</p>
          <Link href="/transactions" className="text-primary-600">Voltar para Lançamentos</Link>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-xl font-semibold mb-4">Editar lançamento</h2>
        <EditForm transaction={data} />
      </div>
    </main>
  )
}
