'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ClientAuthGuard } from '@/components/providers/ClientAuthGuard'
import { InitialPredictionForm } from '@/components/predictions/InitialPredictionForm'
import type { Match, InitialPrediction } from '@/types'
import { Lock } from 'lucide-react'

export default function InitialPredictionPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [predictions, setPredictions] = useState<InitialPrediction[]>([])
  const [champion, setChampion] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(true)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    Promise.all([
      fetch(`${url}/rest/v1/matches?select=*&phase=eq.group&order=match_date.asc`, {
        headers: { apikey: key!, Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${url}/rest/v1/initial_predictions?select=*&user_id=eq.${user.id}`, {
        headers: { apikey: key!, Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${url}/rest/v1/champion_prediction?select=*&user_id=eq.${user.id}`, {
        headers: { apikey: key!, Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${url}/rest/v1/settings?select=*&key=eq.initial_prediction_deadline`, {
        headers: { apikey: key!, Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
    ]).then(([m, p, c, s]) => {
      setMatches(m || [])
      setPredictions(p || [])
      setChampion(c?.[0]?.team || null)
      const deadline = s?.[0]?.value
      if (deadline) setIsOpen(new Date() < new Date(deadline))
      setLoading(false)
    })
  }, [user])

  return (
    <ClientAuthGuard>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            🏆 Pronóstico Inicial Completo
          </h1>
          <p className="text-dark-400 mt-2">
            Completá tu pronóstico de TODOS los partidos antes de que empiece el torneo.
          </p>
        </div>

        {!isOpen ? (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <Lock className="w-6 h-6 text-red-400 shrink-0" />
            <div>
              <h2 className="font-semibold text-white">Pronóstico inicial cerrado</h2>
              <p className="text-dark-400 text-sm mt-1">
                El período para cargar el pronóstico inicial ha concluido.
              </p>
            </div>
          </div>
        ) : loading ? (
          <div className="text-center text-dark-400 py-12">Cargando...</div>
        ) : (
          <InitialPredictionForm
            userId={user?.id || ''}
            groupMatches={matches}
            existingPredictions={predictions}
            existingChampion={champion}
          />
        )}
      </div>
    </ClientAuthGuard>
  )
}
