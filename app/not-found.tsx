// app/not-found.tsx
export default function NotFound() {
  return (
    <main className="flex-1 p-6">
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-card p-6">
        <h2 className="text-lg font-semibold mb-2">Página não encontrada</h2>
        <p className="text-sm text-neutral-600">Verifique o endereço ou use o menu lateral.</p>
      </div>
    </main>
  )
}
