import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, isInitialPredictionOpen } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InitialPredictionForm } from '@/components/predictions/InitialPredictionForm'
import type { Match, InitialPrediction } from '@/types'
import { WORLD_CUP_GROUPS } from '@/types'
import { AlertTriangle, Lock } from 'lucide-react'

export default async function InitialPredictionPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const isOpen = await isInitialPredictionOpen()
  const supabase = createClient()

  const [{ data: matches }, { data: predictions }, { data: champion }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('initial_predictions').select('*').eq('user_id', user.id),
    supabase.from('champion_prediction').select('*').eq('user_id', user.id).single(),
  ])

  const groupMatches = (matches || []).filter((m: Match) => m.phase === 'group')

  if (!isOpen) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-5">
          <Lock className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <h2 className="font-semibold text-white">Pronóstico inicial cerrado</h2>
            <p className="text-dark-400 text-sm mt-1">
              El período para cargar el pronóstico inicial ha concluido.
              Podés seguir participando con los pronósticos en vivo.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const hasSubmitted = (predictions?.length || 0) > 0

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          🏆 Pronóstico Inicial Completo
        </h1>
        <p className="text-dark-400 mt-2">
          Completá tu pronóstico de TODOS los partidos antes de que empiece el torneo.
          Una vez cerrado el período, queda congelado para siempre y sirve de base para los bonus de cadena.
        </p>
      </div>

      {hasSubmitted && (
        <div className="flex items-center gap-3 bg-gold-500/10 border border-gold-500/20 rounded-xl p-4 mb-6">
          <AlertTriangle className="w-5 h-5 text-gold-400 shrink-0" />
          <p className="text-sm text-gold-300">
            Ya enviaste tu pronóstico inicial. Podés modificarlo hasta que cierre el período.
          </p>
        </div>
      )}

      <InitialPredictionForm
        userId={user.id}
        groupMatches={groupMatches as Match[]}
        existingPredictions={(predictions || []) as InitialPrediction[]}
        existingChampion={champion?.team || null}
      />
    </div>
  )
}
