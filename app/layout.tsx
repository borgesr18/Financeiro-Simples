import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: 'Financeiro Simples',
  description: 'MVP de controle de gastos pessoais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen antialiased">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <header className="mb-6 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold">💸 Financeiro Simples</Link>
            <nav className="flex gap-3">
              <Link href="/add" className="btn">+ Lançar</Link>
              <Link href="/transactions" className="underline">Lançamentos</Link>
              <Link href="/budget" className="underline">Orçamento</Link>
              <Link href="/recurring" className="underline">Recorrência</Link>
              <Link href="/settings" className="underline">Config</Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
