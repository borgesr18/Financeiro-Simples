// app/layout.tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import './globals.css'

import {
  FaWallet,
  FaHouse,
  FaList,
  FaChartPie,
  FaBullseye,
  FaLandmark,
  FaCreditCard,
  FaChartLine,
  FaChartBar,
  FaBars,
  FaBell,
  FaPlus,
  FaMagnifyingGlass,
  FaGear,
  FaTrashCan,
} from 'react-icons/fa6'

import UserMiniCard from '@/components/UserMiniCard'
import SuspendedNotice from '@/components/SuspendedNotice'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FinTrack',
  description: 'Controle financeiro simples com Next.js + Supabase',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full`}>
      <body className="min-h-dvh min-h-screen bg-neutral-50 text-neutral-800 font-sans">
        <div className="flex min-h-dvh min-h-screen">
          {/* Sidebar */}
          <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-neutral-200">
            {/* Logo */}
            <div className="p-4 flex items-center border-b border-neutral-100">
              <div className="text-primary-500 mr-2">
                <FaWallet className="text-xl" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-800">FinTrack</h1>
            </div>

            {/* Navegação */}
            <nav className="flex-1 overflow-y-auto p-3">
              {/* Principal */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">
                  Principal
                </h2>
                <ul>
                  <li className="mb-1">
                    <Link
                      href="/"
                      className="flex items-center px-3 py-2 rounded-lg text-primary-600 bg-primary-50 font-medium"
                    >
                      <FaHouse className="w-5 mr-2" />
                      Painel
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/transactions"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaList className="w-5 mr-2" />
                      Lançamentos
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/budget"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaChartPie className="w-5 mr-2" />
                      Orçamentos
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/goals"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaBullseye className="w-5 mr-2" />
                      Metas
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Contas */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">
                  Contas
                </h2>
                <ul>
                  <li className="mb-1">
                    <Link
                      href="/banking"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaLandmark className="w-5 mr-2" />
                      Bancos
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/cards"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaCreditCard className="w-5 mr-2" />
                      Cartões
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/investments"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaChartLine className="w-5 mr-2" />
                      Investimentos
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Insights */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">
                  Insights
                </h2>
                <ul>
                  <li className="mb-1">
                    <Link
                      href="/reports"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaChartBar className="w-5 mr-2" />
                      Relatórios
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/analytics"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaChartLine className="w-5 mr-2" />
                      Análises
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Configurações */}
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">
                  Configurações
                </h2>
                <ul>
                  <li className="mb-1">
                    <Link
                      href="/settings/categories"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaGear className="w-5 mr-2" />
                      Categorias
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/settings/trash"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaTrashCan className="w-5 mr-2" />
                      Lixeira
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/settings/users"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaGear className="w-5 mr-2" />
                      Usuários
                    </Link>
                  </li>
                </ul>
              </div>
            </nav>

            {/* Usuário */}
            <div className="p-4 border-t border-neutral-100">
              <UserMiniCard />
            </div>
          </aside>

          {/* Conteúdo principal */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
              <button className="md:hidden text-neutral-500 hover:text-neutral-700">
                <FaBars className="text-xl" />
              </button>

              <div className="hidden md:block">
                <h1 className="text-xl font-semibold text-neutral-800">Painel</h1>
              </div>

              {/* Busca */}
              <div className="hidden md:block flex-1 max-w-md mx-6">
                <div className="relative">
                  <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Busque lançamentos, orçamentos..."
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-full">
                  <FaBell />
                </button>
                <Link
                  href="/add"
                  className="hidden md:flex items-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  <FaPlus className="mr-2" />
                  <span>Novo lançamento</span>
                </Link>
              </div>
            </header>

            {/* 🚩 Aviso de conta suspensa */}
            <SuspendedNotice />

            {/* Área rolável das páginas */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {children}
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}

