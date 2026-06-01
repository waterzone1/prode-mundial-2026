'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { MatchManager } from '@/components/admin/MatchManager'
import type { Match } from '@/types'

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    fetch(`${url}/rest/v1/matches?select=*&order=match_date.asc`, {
      headers: { apikey: key!, Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => setMatches(data || []))
  }, [])

  return (
    <AdminAuthGuard>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white">Gestión de Partidos</h1>
          <p className="text-dark-400 text-sm mt-1">
            Cargá o corregí resultados manualmente.
          </p>
        </div>
        <MatchManager matches={matches} />
      </div>
    </AdminAuthGuard>
  )
}
