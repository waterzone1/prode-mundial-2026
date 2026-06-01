'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { formatDateShort, cn } from '@/lib/utils'
import type { Match, MatchPhase } from '@/types'
import { PHASE_LABELS } from '@/types'
import { Save, Plus } from 'lucide-react'

interface Props { matches: Match[] }

export function MatchManager({ matches: initial }: Props) {
  const { toast } = useToast()
  const [matches, setMatches] = useState(initial)

  useEffect(() => {
    setMatches(initial)
  }, [initial])
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Match>>({})
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [newMatch, setNewMatch] = useState<Partial<Match>>({
    phase: 'group', status: 'scheduled'
  })

  const startEdit = (match: Match) => {
    setEditId(match.id)
    setEditData({ home_score: match.home_score, away_score: match.away_score, status: match.status })
  }

  const getToken = () => {
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    return session.access_token || ''
  }

  const saveEdit = async () => {
    if (!editId) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ id: editId, ...editData }),
      })
      if (!res.ok) throw new Error()
      setMatches((prev) => prev.map((m) => m.id === editId ? { ...m, ...editData } : m))
      setEditId(null)
      toast('Partido actualizado. Calculando puntos...', 'success')
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const addMatch = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify(newMatch),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setMatches((prev) => [...prev, json.match])
      setShowAdd(false)
      setNewMatch({ phase: 'group', status: 'scheduled' })
      toast('Partido agregado', 'success')
    } catch (e: any) {
      toast(e.message || 'Error al agregar partido', 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusColors: Record<string, 'green' | 'red' | 'blue' | 'gray'> = {
    finished: 'green', live: 'red', scheduled: 'blue', postponed: 'gray'
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4" /> Agregar partido
        </Button>
      </div>

      {showAdd && (
        <div className="bg-dark-900 border border-gold-600/30 rounded-xl p-4 flex flex-col gap-3">
          <h3 className="font-semibold text-white">Nuevo Partido</h3>
          <div className="grid grid-cols-2 gap-3">
            <input className="input-dark text-sm" placeholder="Local" value={newMatch.home_team || ''} onChange={(e) => setNewMatch((p) => ({ ...p, home_team: e.target.value }))} />
            <input className="input-dark text-sm" placeholder="Visitante" value={newMatch.away_team || ''} onChange={(e) => setNewMatch((p) => ({ ...p, away_team: e.target.value }))} />
            <input type="datetime-local" className="input-dark text-sm" value={newMatch.match_date || ''} onChange={(e) => setNewMatch((p) => ({ ...p, match_date: e.target.value }))} />
            <input className="input-dark text-sm" placeholder="Grupo (A-L)" value={newMatch.group_name || ''} onChange={(e) => setNewMatch((p) => ({ ...p, group_name: e.target.value }))} />
            <select className="input-dark text-sm" value={newMatch.phase || 'group'} onChange={(e) => setNewMatch((p) => ({ ...p, phase: e.target.value as MatchPhase }))}>
              {Object.entries(PHASE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button size="sm" loading={saving} onClick={addMatch}>Guardar</Button>
          </div>
        </div>
      )}

      <div className="bg-dark-900 rounded-xl border border-dark-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-dark-800/50">
              <tr className="text-dark-400 text-xs uppercase tracking-wide">
                <th className="text-left p-3">Partido</th>
                <th className="text-left p-3 hidden md:table-cell">Fecha</th>
                <th className="text-left p-3 hidden sm:table-cell">Fase</th>
                <th className="text-center p-3">Resultado</th>
                <th className="text-center p-3">Estado</th>
                <th className="text-right p-3">Acción</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => {
                const isEditing = editId === match.id
                return (
                  <tr key={match.id} className={cn('border-t border-dark-800/50', isEditing && 'bg-dark-800/30')}>
                    <td className="p-3 text-white font-medium">
                      {match.home_team} vs {match.away_team}
                    </td>
                    <td className="p-3 text-dark-400 hidden md:table-cell">{formatDateShort(match.match_date)}</td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant="gray">{match.group_name ? `G${match.group_name}` : PHASE_LABELS[match.phase]}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center gap-1 justify-center">
                          <input
                            type="number" min="0" max="20"
                            className="w-10 text-center input-dark py-0.5 text-sm"
                            value={editData.home_score ?? ''}
                            onChange={(e) => setEditData((p) => ({ ...p, home_score: parseInt(e.target.value) }))}
                          />
                          <span>-</span>
                          <input
                            type="number" min="0" max="20"
                            className="w-10 text-center input-dark py-0.5 text-sm"
                            value={editData.away_score ?? ''}
                            onChange={(e) => setEditData((p) => ({ ...p, away_score: parseInt(e.target.value) }))}
                          />
                        </div>
                      ) : (
                        <span className="text-gold-400 font-bold">
                          {match.home_score !== null ? `${match.home_score}-${match.away_score}` : '-'}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <select
                          className="input-dark text-xs py-0.5"
                          value={editData.status || match.status}
                          onChange={(e) => setEditData((p) => ({ ...p, status: e.target.value as Match['status'] }))}
                        >
                          <option value="scheduled">Programado</option>
                          <option value="live">En vivo</option>
                          <option value="finished">Finalizado</option>
                          <option value="postponed">Postergado</option>
                        </select>
                      ) : (
                        <Badge variant={statusColors[match.status] || 'gray'}>{match.status}</Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>✕</Button>
                          <Button size="sm" loading={saving} onClick={saveEdit}>
                            <Save className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => startEdit(match)}>Editar</Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
