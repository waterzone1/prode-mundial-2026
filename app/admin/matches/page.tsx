'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { MatchManager } from '@/components/admin/MatchManager'
import { sbFetch } from '@/lib/supabase/fetch'
import type { Match } from '@/types'

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])

  useEffect(() => {
    sbFetch('matches', 'select=*&order=match_date.asc').then(data => setMatches(data || []))
  }, [])

  return (
    <AdminAuthGuard>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white">Gestión de Partidos</h1>
          <p className="text-dark-400 text-sm mt-1">Cargá o corregí resultados manualmente.</p>
        </div>
        <MatchManager matches={matches} />
      </div>
    </AdminAuthGuard>
  )
}
