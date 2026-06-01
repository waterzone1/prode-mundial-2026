'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export function ClientAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gold-400 animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
