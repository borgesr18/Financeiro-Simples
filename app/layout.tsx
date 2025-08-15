import './globals.css'
import Link from 'next/link'
import { Inter } from 'next/font/google'
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
  FaCircleQuestion,
  FaMagnifyingGlass,
  FaGear,
  FaFileLines,
} from 'react-icons/fa6'
import AuthMenu from '@/components/AuthMenu'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Financeiro Simples',
  description: 'MVP de controle de gastos pessoais',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br" className={inter.variable}>
      <body className="bg-neutral-50 text-neutral-800 font-sans">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar */}
          <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-neutral-200">
            <div className="p-4 flex items-center border-b border-neutral-100">
              <div className="text-primary-500 mr-2">
                <FaWallet className="text-xl" />
              </div>
              <h1 className="text-xl font-semibold text-neutral-800">Financeiro</h1>
            </div>

            <nav className="flex-1 overflow-y-auto p-3">
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">Main</h2>
                <ul>
                  <li className="mb-1">
                    <Link href="/" className="flex items-center px-3 py-2 rounded-lg text-primary-600 bg-primary-50 font-medium">
                      <FaHouse className="w-5 mr-2" /> Dashboard
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link href="/transactions" className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaList className="w-5 mr-2" /> Lançamentos
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link href="/budget" className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaChartPie className="w-5 mr-2" /> Orçamento
                    </Link>
                  </li>
                  <li className="mb-1">
                    <Link href="/recurring" className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaBullseye className="w-5 mr-2" /> Metas
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">Contas</h2>
                <ul>
                  <li className="mb-1">
                    <span className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaLandmark className="w-5 mr-2" /> Bancos
                    </span>
                  </li>
                  <li className="mb-1">
                    <span className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaCreditCard className="w-5 mr-2" /> Cartões
                    </span>
                  </li>
                  <li className="mb-1">
                    <span className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaChartLine className="w-5 mr-2" /> Investimentos
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 px-3">Insights</h2>
                <ul>
                  <li className="mb-1">
                    <span className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaFileLines className="w-5 mr-2" /> Relatórios
                    </span>
                  </li>
                  <li className="mb-1">
                    <span className="flex items-center px-3 py-2 rounded-lg text-neutral-600 hover:bg-neutral-50 font-medium">
                      <FaChartBar className="w-5 mr-2" /> Analytics
                    </span>
                  </li>
                </ul>
              </div>
            </nav>

            {/* Usuário (estático por enquanto) */}
            <div className="p-4 border-t border-neutral-100">
              <div className="flex items-center">
                <img
                  src="https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg"
                  alt="avatar"
                  className="w-9 h-9 rounded-full mr-3"
                />
                <div>
                  <p className="text-sm font-medium text-neutral-800">Rodrigo Borges</p>
                  <p className="text-xs text-neutral-500">rodrigo@example.com</p>
                </div>
                <button className="ml-auto text-neutral-400 hover:text-neutral-600"><FaGear /></button>
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <header className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
              {/* menu mobile (não funcional ainda) */}
              <button className="md:hidden text-neutral-500 hover:text-neutral-700">
                <FaBars className="text-xl" />
              </button>

              <div className="hidden md:block">
                <h1 className="text-xl font-semibold text-neutral-800">Dashboard</h1>
              </div>

              <div className="hidden md:block flex-1 max-w-md mx-6">
                <div className="relative">
                  <FaMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    placeholder="Buscar lançamentos, orçamentos..."
                    className="w-full pl-10 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-full"><FaBell /></button>
                <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50 rounded-full"><FaCircleQuestion /></button>
                <Link href="/add" className="hidden md:flex items-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
                  <FaPlus className="mr-2" />
                  <span>Novo Lançamento</span>
                </Link>
                <AuthMenu />
              </div>
            </header>

            {children}
          </div>
        </div>
      </body>
    </html>
  )
}
