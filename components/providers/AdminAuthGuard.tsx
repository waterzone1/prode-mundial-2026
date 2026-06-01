'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login'
    }
    if (!loading && user && profile && profile.role !== 'admin') {
      window.location.href = '/'
    }
  }, [user, profile, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gold-400 animate-pulse">Cargando...</div>
      </div>
    )
  }

  if (!user || !profile || profile.role !== 'admin') return null

  return <>{children}</>
}
