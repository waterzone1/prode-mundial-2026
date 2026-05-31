'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { formatDateShort, isMatchLockedStrict, cn } from '@/lib/utils'
import type { Match, LivePrediction } from '@/types'
import { PHASE_LABELS } from '@/types'
import { Lock, Clock, CheckCircle } from 'lucide-react'

interface Props {
  userId: string
  matches: Match[]
  predictions: LivePrediction[]
}

interface PredState {
  home: string
  away: string
  dirty: boolean
  saving: boolean
}

export function LivePredictionsView({ userId, matches, predictions }: Props) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>('group')

  const [preds, setPreds] = useState<Record<string, PredState>>(() => {
    const init: Record<string, PredState> = {}
    for (const m of matches) {
      const ex = predictions.find((p) => p.match_id === m.id)
      init[m.id] = {
        home: ex ? String(ex.predicted_home) : '',
        away: ex ? String(ex.predicted_away) : '',
        dirty: false,
        saving: false,
      }
    }
    return init
  })

  const phases = useMemo(() => {
    const found = new Set(matches.map((m) => m.phase))
    return ['group','round_of_32','round_of_16','quarter_final','semi_final','final'] .filter((p) => found.has(p as Match['phase']))
  }, [matches])

  const filteredMatches = matches.filter((m) => m.phase === activeTab)

  const save = async (matchId: string) => {
    const p = preds[matchId]
    if (p.home === '' || p.away === '') {
      toast('Ingresá ambos goles', 'error')
      return
    }
    setPreds((prev) => ({ ...prev, [matchId]: { ...prev[matchId], saving: true } }))
    try {
      const res = await fetch('/api/predictions/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchId,
          predicted_home: parseInt(p.home),
          predicted_away: parseInt(p.away),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPreds((prev) => ({ ...prev, [matchId]: { ...prev[matchId], dirty: false, saving: false } }))
      toast('Pronóstico guardado ✓', 'success')
    } catch (e: any) {
      toast(e.message, 'error')
      setPreds((prev) => ({ ...prev, [matchId]: { ...prev[matchId], saving: false } }))
    }
  }

  return (
    <div>
      {/* Phase tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => setActiveTab(phase)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              activeTab === phase
                ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30'
                : 'text-dark-400 hover:text-white hover:bg-dark-800'
            )}
          >
            {PHASE_LABELS[phase as Match['phase']]}
          </button>
        ))}
      </div>

      {filteredMatches.length === 0 && (
        <p className="text-dark-400 text-center py-12">
          No hay partidos disponibles en esta fase todavía.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredMatches.map((match) => {
          const p = preds[match.id] || { home: '', away: '', dirty: false, saving: false }
          const locked = isMatchLockedStrict(match.match_date) || match.status !== 'scheduled'
          const finished = match.status === 'finished'
          const hasExisting = predictions.some((pr) => pr.match_id === match.id)

          return (
            <div
              key={match.id}
              className={cn(
                'bg-dark-900 rounded-xl border p-4 transition-colors',
                locked ? 'border-dark-700/30 opacity-70' : 'border-dark-700/50 hover:border-dark-600'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {match.group_name && (
                    <Badge variant="gray">Grupo {match.group_name}</Badge>
                  )}
                  {!match.group_name && (
                    <Badge variant="gold">{PHASE_LABELS[match.phase]}</Badge>
                  )}
                </div>
                {locked ? (
                  <div className="flex items-center gap-1 text-dark-500 text-xs">
                    <Lock className="w-3 h-3" />
                    {finished ? 'Finalizado' : 'Bloqueado'}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-dark-400 text-xs">
                    <Clock className="w-3 h-3" />
                    {formatDateShort(match.match_date)}
                  </div>
                )}
              </div>

              {/* Match */}
              <div className="flex items-center gap-3 mb-3">
                <span className="flex-1 text-right text-sm font-semibold text-white">{match.home_team}</span>
                {finished ? (
                  <div className="text-center shrink-0">
                    <span className="text-gold-400 font-bold">{match.home_score} - {match.away_score}</span>
                    <p className="text-xs text-dark-500">Resultado final</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="number" min="0" max="20"
                      disabled={locked}
                      className="w-11 text-center input-dark py-1.5 text-sm disabled:opacity-40"
                      value={p.home}
                      onChange={(e) => setPreds((prev) => ({
                        ...prev,
                        [match.id]: { ...prev[match.id], home: e.target.value, dirty: true }
                      }))}
                    />
                    <span className="text-dark-500 font-bold">-</span>
                    <input
                      type="number" min="0" max="20"
                      disabled={locked}
                      className="w-11 text-center input-dark py-1.5 text-sm disabled:opacity-40"
                      value={p.away}
                      onChange={(e) => setPreds((prev) => ({
                        ...prev,
                        [match.id]: { ...prev[match.id], away: e.target.value, dirty: true }
                      }))}
                    />
                  </div>
                )}
                <span className="flex-1 text-sm font-semibold text-white">{match.away_team}</span>
              </div>

              {/* My prediction result (if finished) */}
              {finished && hasExisting && (
                <div className="text-xs text-center text-dark-400">
                  Mi pronóstico: {p.home} - {p.away}
                </div>
              )}

              {/* Save button */}
              {!locked && (
                <Button
                  size="sm"
                  variant={p.dirty ? 'gold' : 'outline'}
                  className="w-full mt-2"
                  loading={p.saving}
                  onClick={() => save(match.id)}
                >
                  {hasExisting && !p.dirty
                    ? <><CheckCircle className="w-3.5 h-3.5" /> Guardado</>
                    : 'Guardar pronóstico'}
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
