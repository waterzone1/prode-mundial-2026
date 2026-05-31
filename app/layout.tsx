import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/providers/ToastProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'

export const metadata: Metadata = {
  title: 'Prode Mundial 2026 🏆',
  description: 'Hacé tus pronósticos del Mundial de Fútbol 2026',
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <body>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
