import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'
import { Settings, Users, Calendar, BarChart2, RotateCcw } from 'lucide-react'

const adminLinks = [
  { href: '/admin', label: 'Resumen', icon: BarChart2, exact: true },
  { href: '/admin/scoring', label: 'Puntuación', icon: Settings },
  { href: '/admin/users', label: 'Usuarios', icon: Users },
  { href: '/admin/matches', label: 'Partidos', icon: Calendar },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-widest">Panel Admin</span>
        </div>
        <div className="flex gap-6 flex-col md:flex-row">
          {/* Sidebar */}
          <aside className="md:w-48 shrink-0">
            <nav className="flex md:flex-col gap-1">
              {adminLinks.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
                >
                  <Icon className="w-4 h-4" /> {label}
                </Link>
              ))}
            </nav>
          </aside>
          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}
