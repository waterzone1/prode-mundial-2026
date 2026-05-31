import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/Card'
import { BarChart2, Trophy, Target, Zap } from 'lucide-react'

export const revalidate = 120

export default async function StatsPage() {
  const supabase = createClient()

  const [{ data: matches }, { data: scores }, { data: livePreds }] = await Promise.all([
    supabase.from('matches').select('*').eq('status', 'finished'),
    supabase.from('scores').select('*, profiles(username)').order('total_points', { ascending: false }),
    supabase.from('live_predictions').select('match_id, predicted_home, predicted_away'),
  ])

  // Most popular predictions per match
  const matchPredStats: Record<string, {
    home: number; draw: number; away: number; total: number; match: any
  }> = {}

  for (const m of matches || []) {
    matchPredStats[m.id] = { home: 0, draw: 0, away: 0, total: 0, match: m }
  }
  for (const p of livePreds || []) {
    if (!matchPredStats[p.match_id]) continue
    matchPredStats[p.match_id].total++
    if (p.predicted_home > p.predicted_away) matchPredStats[p.match_id].home++
    else if (p.predicted_home < p.predicted_away) matchPredStats[p.match_id].away++
    else matchPredStats[p.match_id].draw++
  }

  const chainLeader = scores?.[0]
  const totalMatches = matches?.length || 0
  const totalPredictions = livePreds?.length || 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-gold-400" /> Estadísticas del Torneo
        </h1>
        <p className="text-dark-400 text-sm mt-1">Datos y curiosidades del prode</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon="⚽" label="Partidos disputados" value={totalMatches} />
        <StatCard icon="🎯" label="Pronósticos cargados" value={totalPredictions} />
        <StatCard icon="👥" label="Participantes" value={scores?.length || 0} />
        <StatCard icon="🏆" label="Líder actual" value={chainLeader?.profiles?.username || '—'} />
      </div>

      {/* Chain bonus leader */}
      {scores && scores.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-gold-400" />
            <h2 className="text-lg font-bold text-white">Ranking — Solo Pronóstico Inicial (Capa 1)</h2>
          </div>
          <p className="text-dark-400 text-sm mb-4">
            Quién predijo mejor el torneo desde el inicio — basado exclusivamente en bonus de cadena.
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-dark-400 text-xs uppercase border-b border-dark-800">
                <th className="text-left pb-2">#</th>
                <th className="text-left pb-2">Usuario</th>
                <th className="text-right pb-2">Bonus Cadena</th>
              </tr>
            </thead>
            <tbody>
              {[...scores]
                .sort((a, b) => b.chain_bonus_points - a.chain_bonus_points)
                .slice(0, 10)
                .map((s, i) => (
                  <tr key={s.user_id} className="border-b border-dark-800/30">
                    <td className="py-2 text-dark-400">{i + 1}</td>
                    <td className="py-2 text-white">{s.profiles?.username || '—'}</td>
                    <td className="py-2 text-right text-gold-400 font-bold">{s.chain_bonus_points}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Match prediction distribution */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-bold text-white">Distribución de Pronósticos por Partido</h2>
        </div>
        <div className="flex flex-col gap-3">
          {Object.values(matchPredStats)
            .filter((s) => s.total > 0)
            .slice(0, 10)
            .map((s) => (
              <div key={s.match.id} className="bg-dark-800/50 rounded-lg p-3">
                <div className="flex justify-between text-xs text-dark-400 mb-2">
                  <span>{s.match.home_team}</span>
                  <span>{s.match.away_team}</span>
                </div>
                <div className="flex rounded-full overflow-hidden h-4 gap-0.5">
                  {s.total > 0 && (
                    <>
                      <div
                        className="bg-blue-500/70 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(s.home / s.total) * 100}%`, minWidth: s.home > 0 ? '20px' : '0' }}
                      >
                        {s.home > 0 ? `${Math.round((s.home/s.total)*100)}%` : ''}
                      </div>
                      <div
                        className="bg-dark-600 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(s.draw / s.total) * 100}%`, minWidth: s.draw > 0 ? '20px' : '0' }}
                      >
                        {s.draw > 0 ? `${Math.round((s.draw/s.total)*100)}%` : ''}
                      </div>
                      <div
                        className="bg-orange-500/70 flex items-center justify-center text-xs text-white font-medium"
                        style={{ width: `${(s.away / s.total) * 100}%`, minWidth: s.away > 0 ? '20px' : '0' }}
                      >
                        {s.away > 0 ? `${Math.round((s.away/s.total)*100)}%` : ''}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span className="text-blue-400">Local: {s.home}</span>
                  <span className="text-dark-400">Empate: {s.draw}</span>
                  <span className="text-orange-400">Visitante: {s.away}</span>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <Card>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xl font-bold text-gold-400">{value}</div>
      <div className="text-xs text-dark-400 mt-0.5">{label}</div>
    </Card>
  )
}
