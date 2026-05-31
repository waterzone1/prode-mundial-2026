import { createClient } from '@/lib/supabase/server'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { EvolutionChart } from '@/components/standings/EvolutionChart'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Trophy, TrendingUp } from 'lucide-react'

export const revalidate = 60

export default async function StandingsPage() {
  const supabase = createClient()

  const { data: scores } = await supabase
    .from('scores')
    .select('*, profiles(username)')
    .order('total_points', { ascending: false })

  // Build evolution data from chain_bonus_log + scores
  // Simplified: use phase-based snapshots
  const { data: matches } = await supabase
    .from('matches')
    .select('id, phase, match_date')
    .eq('status', 'finished')
    .order('match_date', { ascending: true })

  const standings = (scores || []).map((s, i) => ({
    ...s,
    rank: i + 1,
    prev_rank: null,
    accuracy: s.exact_results + s.correct_winners > 0
      ? Math.round((s.exact_results / Math.max(1, s.exact_results + s.correct_winners)) * 100)
      : 0,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-gold-400" /> Tabla de Posiciones
        </h1>
        <p className="text-dark-400 text-sm mt-1">Ranking actualizado en tiempo real</p>
      </div>

      <Card gold>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-dark-400 text-xs uppercase tracking-wide border-b border-dark-800">
              <th className="text-left pb-3 pl-2">#</th>
              <th className="text-left pb-3">Usuario</th>
              <th className="text-right pb-3">Total</th>
              <th className="text-right pb-3">Exactos</th>
              <th className="text-right pb-3">Ganadores</th>
              <th className="text-right pb-3 hidden sm:table-cell">Cadena</th>
              <th className="text-right pb-3 hidden md:table-cell">% Acierto</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, i) => (
              <tr key={row.user_id} className="border-b border-dark-800/30 hover:bg-dark-800/20 transition-colors">
                <td className="py-3 pl-2">
                  <span className="font-bold text-dark-300">
                    {i + 1 === 1 ? '🥇' : i + 1 === 2 ? '🥈' : i + 1 === 3 ? '🥉' : i + 1}
                  </span>
                </td>
                <td className="py-3 font-medium text-white">{row.profiles?.username || '—'}</td>
                <td className="py-3 text-right font-bold text-gold-400">{row.total_points}</td>
                <td className="py-3 text-right text-dark-300">{row.exact_results}</td>
                <td className="py-3 text-right text-dark-300">{row.correct_winners}</td>
                <td className="py-3 text-right hidden sm:table-cell">
                  <span className="text-gold-500">{row.chain_bonus_points}</span>
                </td>
                <td className="py-3 text-right hidden md:table-cell text-dark-400">
                  {row.accuracy}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gold-400" />
          <h2 className="text-lg font-bold text-white">Evolución de Posiciones</h2>
        </div>
        <EvolutionChart data={[]} users={[]} />
      </Card>
    </div>
  )
}
