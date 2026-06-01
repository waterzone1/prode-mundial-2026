'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { useAuth } from '@/components/providers/AuthProvider'
import { MatchManager } from '@/components/admin/MatchManager'
import type { Match } from '@/types'

const SB_URL = 'https://jzmuwrmizggtsnkrgens.supabase.co'
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bXV3cm1pemdndHNua3JnZW5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyNDgzMTgsImV4cCI6MjA5NTgyNDMxOH0.PJcjbArbCMa3RZZa-0jtMYj_nn5MRiE4Zt3ZJD2dHE8'

function MatchesContent() {
  const { loading: authLoading, user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (authLoading || !user) return
    let cancelled = false
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token || SB_KEY
    fetch(`${SB_URL}/rest/v1/matches?select=*&order=match_date.asc`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        if (Array.isArray(data)) {
          setMatches(data)
        } else {
          console.error('[MatchesPage] unexpected response:', data)
          setMatches([])
        }
        setLoaded(true)
      })
      .catch(err => {
        if (cancelled) return
        console.error('[MatchesPage] fetch error:', err)
        setLoaded(true)
      })
    return () => { cancelled = true }
  }, [authLoading, user])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">Gestión de Partidos</h1>
        <p className="text-dark-400 text-sm mt-1">Cargá o corregí resultados manualmente.</p>
      </div>
      {!loaded ? (
        <p className="text-dark-400">Cargando partidos...</p>
      ) : (
        <MatchManager matches={matches} />
      )}
    </div>
  )
}

export default function MatchesPage() {
  return (
    <AdminAuthGuard>
      <MatchesContent />
    </AdminAuthGuard>
  )
}
