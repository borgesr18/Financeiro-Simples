// app/layout.tsx
import './globals.css'
import Link from 'next/link'
import { Inter } from 'next/font/google'
import {
  FaWallet,
  FaHome,
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
  FaSearch,
  FaCog,
  FaQuestionCircle,
  FaFile, // <- substitui FaFileAlt
} from 'react-icons/fa'
import AuthMenu from '@/components/AuthMenu'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Financeiro Simples',
  description: 'Controle de gastos pessoal',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-neutral-50 text-neutral-800 font-sans">
        <div className="flex h-screen overflow-hidden">
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
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">Main</h2>
                <ul>
                  <li className="mb-1">
                    <Link
                      href="/"
                      className="flex items-center px-3 py-2 rounded-lg text-primary-600 bg-primary-50 font-medium"
                    >
                      <FaHome className="w-5 mr-2" />
                      Dashboard
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/transactions"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaList className="w-5 mr-2" />
                      Transactions
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/budget"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaChartPie className="w-5 mr-2" />
                      Budgets
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/goals"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaBullseye className="w-5 mr-2" />
                      Goals
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">Accounts</h2>
                <ul>
                  <li className="mb-1">
                    <Link
                      href="/banking"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaLandmark className="w-5 mr-2" />
                      Banking
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/cards"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaCreditCard className="w-5 mr-2" />
                      Cards
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link
                      href="/investments"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaChartLine className="w-5 mr-2" />
                      Investments
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">Insights</h2>
                <ul>
                  <li className="mb-1">
                    <Link
                      href="/reports"
                      className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium"
                    >
                      <FaFile className="w-5 mr-2" />
                      Reports
                    </Link>
                  </li>
                  <li className="mb-1">
                    <span className="flex items-center px-3 py-2 rounded-lg text-neutral-400 font-medium cursor-not-allowed">
                      <FaChartBar className="w-5 mr-2" />
                      Analytics
                    </span>
                  </li>
                </ul>
              </div>
            </nav>

            {/* Usuário */}
            <div className="p-4 border-t border-neutral-100">
              <AuthMenu />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
              <button className="md:hidden text-neutral-500 hover:text-neutral-700">
                <FaBars className="text-xl" />
              </button>

              <div className="hidden md:block">
                <h1 className="text-xl font-semibold text-neutral-800">Dashboard</h1>
              </div>

              <div className="hidden md:block flex-1 max-w-md mx-6">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Search transactions, budgets..."
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-full">
                  <FaBell />
                </button>
                <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-full">
                  <FaQuestionCircle />
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

            {/* Page outlet */}
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
