'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/providers/ToastProvider'
import { formatDateShort, cn } from '@/lib/utils'
import type { Match, InitialPrediction, PredictedWinner } from '@/types'
import { WORLD_CUP_GROUPS, PHASE_LABELS } from '@/types'
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react'

interface Props {
  userId: string
  groupMatches: Match[]
  existingPredictions: InitialPrediction[]
  existingChampion: string | null
}

interface PredictionState {
  home: string
  away: string
}

export function InitialPredictionForm({ userId, groupMatches, existingPredictions, existingChampion }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [champion, setChampion] = useState(existingChampion || '')
  const [expandedGroup, setExpandedGroup] = useState<string | null>('A')

  const [predictions, setPredictions] = useState<Record<string, PredictionState>>(() => {
    const init: Record<string, PredictionState> = {}
    for (const m of groupMatches) {
      const existing = existingPredictions.find((p) => p.match_id === m.id)
      init[m.id] = {
        home: existing ? String(existing.predicted_home) : '',
        away: existing ? String(existing.predicted_away) : '',
      }
    }
    return init
  })

  const matchesByGroup = useMemo(() => {
    const grouped: Record<string, Match[]> = {}
    for (const m of groupMatches) {
      const g = m.group_name || 'Sin grupo'
      if (!grouped[g]) grouped[g] = []
      grouped[g].push(m)
    }
    return grouped
  }, [groupMatches])

  const allTeams = useMemo(() => {
    const teams = new Set<string>()
    for (const m of groupMatches) {
      teams.add(m.home_team)
      teams.add(m.away_team)
    }
    return Array.from(teams).sort()
  }, [groupMatches])

  const setPred = (matchId: string, field: 'home' | 'away', value: string) => {
    setPredictions((prev) => ({
      ...prev,
      [matchId]: { ...prev[matchId], [field]: value },
    }))
  }

  const handleSubmit = async () => {
    // Validate all predictions are filled
    const missing = groupMatches.filter((m) => {
      const p = predictions[m.id]
      return !p || p.home === '' || p.away === ''
    })
    if (missing.length > 0) {
      toast(`Faltan ${missing.length} pronóstico(s) sin completar`, 'error')
      return
    }
    if (!champion) {
      toast('Seleccioná un campeón', 'error')
      return
    }

    setLoading(true)
    try {
      const payload = groupMatches.map((m) => ({
        match_id: m.id,
        predicted_home: parseInt(predictions[m.id].home),
        predicted_away: parseInt(predictions[m.id].away),
      }))

      const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
      const res = await fetch('/api/predictions/initial', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ predictions: payload, champion }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      toast('✅ Pronóstico inicial guardado correctamente', 'gold')
    } catch (e: any) {
      toast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const completedCount = groupMatches.filter((m) => {
    const p = predictions[m.id]
    return p && p.home !== '' && p.away !== ''
  }).length

  return (
    <div className="flex flex-col gap-4">
      {/* Progress */}
      <div className="bg-dark-900 rounded-xl border border-dark-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-dark-300">Progreso de pronósticos</span>
          <span className="text-sm font-semibold text-gold-400">{completedCount}/{groupMatches.length}</span>
        </div>
        <div className="w-full bg-dark-800 rounded-full h-2">
          <div
            className="bg-gradient-gold h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedCount / Math.max(groupMatches.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Group predictions */}
      {WORLD_CUP_GROUPS.filter((g) => matchesByGroup[g]).map((group) => {
        const gMatches = matchesByGroup[group] || []
        const isExpanded = expandedGroup === group
        const gCompleted = gMatches.filter((m) => {
          const p = predictions[m.id]
          return p && p.home !== '' && p.away !== ''
        }).length

        return (
          <div key={group} className="bg-dark-900 rounded-xl border border-dark-700/50 overflow-hidden">
            <button
              onClick={() => setExpandedGroup(isExpanded ? null : group)}
              className="w-full flex items-center justify-between p-4 hover:bg-dark-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-bold text-gold-400 text-lg">Grupo {group}</span>
                <span className="text-xs text-dark-400 bg-dark-800 px-2 py-0.5 rounded">
                  {gCompleted}/{gMatches.length}
                </span>
                {gCompleted === gMatches.length && (
                  <span className="text-green-400 text-xs">✓ Completo</span>
                )}
              </div>
              {isExpanded ? <ChevronUp className="w-4 h-4 text-dark-400" /> : <ChevronDown className="w-4 h-4 text-dark-400" />}
            </button>

            {isExpanded && (
              <div className="border-t border-dark-800 p-4 flex flex-col gap-3">
                {gMatches.map((match) => {
                  const p = predictions[match.id] || { home: '', away: '' }
                  return (
                    <div key={match.id} className="bg-dark-800/50 rounded-lg p-3">
                      <p className="text-xs text-dark-400 mb-2">{formatDateShort(match.match_date)}</p>
                      <div className="flex items-center gap-3">
                        <span className="flex-1 text-right text-sm font-medium text-white">{match.home_team}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="number"
                            min="0" max="20"
                            className="w-12 text-center input-dark py-1.5 text-sm"
                            value={p.home}
                            onChange={(e) => setPred(match.id, 'home', e.target.value)}
                          />
                          <span className="text-dark-500">-</span>
                          <input
                            type="number"
                            min="0" max="20"
                            className="w-12 text-center input-dark py-1.5 text-sm"
                            value={p.away}
                            onChange={(e) => setPred(match.id, 'away', e.target.value)}
                          />
                        </div>
                        <span className="flex-1 text-sm font-medium text-white">{match.away_team}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Champion */}
      <div className="bg-dark-900 rounded-xl border border-gold-600/30 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-gold-400" />
          <h3 className="font-bold text-white">Campeón del Mundial</h3>
        </div>
        <select
          className="input-dark"
          value={champion}
          onChange={(e) => setChampion(e.target.value)}
        >
          <option value="">— Seleccioná el campeón —</option>
          {allTeams.map((team) => (
            <option key={team} value={team}>{team}</option>
          ))}
        </select>
      </div>

      <Button onClick={handleSubmit} loading={loading} size="lg" className="w-full">
        💾 Guardar pronóstico inicial completo
      </Button>
    </div>
  )
}
