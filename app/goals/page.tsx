// app/goals/page.tsx
export const dynamic = 'force-dynamic'

export default function GoalsPage() {
  return (
    <main className="flex-1 overflow-y-auto p-6 bg-neutral-50">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-2xl font-bold mb-2">Goals</h2>
        <p className="text-neutral-600">
          Página de metas futura. Em breve mostraremos objetivos de economia/investimento.
        </p>
      </div>
    </main>
  )
}
