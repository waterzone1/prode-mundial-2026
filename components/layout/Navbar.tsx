'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, BarChart2, List, Target, Settings, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Tabla', icon: List },
  { href: '/standings', label: 'Posiciones', icon: BarChart2 },
  { href: '/predictions/live', label: 'Pronósticos', icon: Target, auth: true },
  { href: '/stats', label: 'Estadísticas', icon: Trophy },
]

export function Navbar() {
  const { profile, signOut } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-40 bg-dark-950/95 backdrop-blur-md border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-gold-400 group-hover:text-gold-300 transition-colors hidden sm:block">
            Prode <span className="text-white">Mundial 2026</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon, auth }) => {
            if (auth && !profile) return null
            const active = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-gold-600/15 text-gold-400'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-2">
          {profile ? (
            <>
              {profile.role === 'admin' && (
                <a href="/admin" className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname.startsWith('/admin')
                    ? 'bg-gold-600/15 text-gold-400'
                    : 'text-dark-300 hover:text-white hover:bg-dark-800'
                )}>
                  <Settings className="w-4 h-4" /> Admin
                </a>
              )}
              <a href="/profile" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-dark-300 hover:text-white hover:bg-dark-800 transition-colors">
                <User className="w-4 h-4" />
                <span className="text-gold-400 font-medium">{profile.username}</span>
              </a>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-dark-400 hover:text-red-400 hover:bg-dark-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <a href="/login" className="btn-outline text-sm px-3 py-1.5">Ingresar</a>
              <a href="/register" className="btn-gold text-sm px-3 py-1.5">Registrarse</a>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden text-dark-300 hover:text-white" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-dark-800 bg-dark-950 p-4 flex flex-col gap-1 animate-fade-in">
          {navLinks.map(({ href, label, icon: Icon, auth }) => {
            if (auth && !profile) return null
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-dark-200 hover:text-white hover:bg-dark-800"
              >
                <Icon className="w-4 h-4" /> {label}
              </Link>
            )
          })}
          {profile?.role === 'admin' && (
            <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gold-400 hover:bg-dark-800">
              <Settings className="w-4 h-4" /> Admin
            </Link>
          )}
          <div className="border-t border-dark-800 pt-3 mt-2">
            {profile ? (
              <button onClick={signOut} className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-dark-800 rounded-lg w-full">
                <LogOut className="w-4 h-4" /> Cerrar sesión
              </button>
            ) : (
              <div className="flex gap-2">
                <a href="/login" className="btn-outline text-sm flex-1 text-center">Ingresar</a>
                <a href="/register" className="btn-gold text-sm flex-1 text-center">Registrarse</a>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
