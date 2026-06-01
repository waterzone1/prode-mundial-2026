'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ClientAuthGuard } from '@/components/providers/ClientAuthGuard'
import { LivePredictionsView } from '@/components/predictions/LivePredictionsView'
import type { Match, LivePrediction } from '@/types'

export default function LivePredictionsPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<LivePrediction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    Promise.all([
      fetch(`${url}/rest/v1/matches?select=*&order=match_date.asc`, {
        headers: { apikey: key!, Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${url}/rest/v1/live_predictions?select=*&user_id=eq.${user.id}`, {
        headers: { apikey: key!, Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
    ]).then(([m, p]) => {
      setMatches(m || [])
      setPredictions(p || [])
      setLoading(false)
    })
  }, [user])

  return (
    <ClientAuthGuard>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">🎯 Pronósticos en Vivo</h1>
          <p className="text-dark-400 mt-1 text-sm">
            Podés modificar tus pronósticos hasta 1 hora antes de cada partido.
          </p>
        </div>
        {loading ? (
          <div className="text-center text-dark-400 py-12">Cargando partidos...</div>
        ) : (
          <LivePredictionsView
            userId={user?.id || ''}
            matches={matches}
            predictions={predictions}
          />
        )}
      </div>
    </ClientAuthGuard>
  )
}
