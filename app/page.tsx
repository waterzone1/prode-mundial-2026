import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { StandingsTable } from '@/components/standings/StandingsTable'
import { createClient } from '@/lib/supabase/server'
import { formatDateShort } from '@/lib/utils'
import { Calendar, Trophy, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Match } from '@/types'
import { PHASE_LABELS } from '@/types'

export const revalidate = 60

async function getUpcomingMatches() {
  const supabase = createClient()
  const { data } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['scheduled', 'live'])
    .order('match_date', { ascending: true })
    .limit(6)
  return (data || []) as Match[]
}

async function getStandings() {
  const supabase = createClient()
  const { data } = await supabase
    .from('scores')
    .select('*, profiles(username)')
    .order('total_points', { ascending: false })
    .limit(20)
  return data || []
}

export default async function HomePage() {
  const [matches, standings] = await Promise.all([getUpcomingMatches(), getStandings()])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4 py-1.5 text-gold-400 text-sm mb-4">
            <Trophy className="w-4 h-4" /> Mundial de Fútbol 2026
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2">
            <span className="gold-text">Prode</span>{' '}
            <span className="text-white">Mundial 2026</span>
          </h1>
          <p className="text-dark-400 max-w-md mx-auto">
            Predecí todos los partidos del Mundial y competí con tus amigos en tiempo real.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Standings */}
          <div className="lg:col-span-2">
            <Card gold>
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-gold-400" />
                <h2 className="text-lg font-bold text-white">Tabla de Posiciones</h2>
              </div>
              <StandingsTable standings={standings} compact />
            </Card>
          </div>

          {/* Upcoming matches */}
          <div>
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-gold-400" />
                <h2 className="text-lg font-bold text-white">Próximos Partidos</h2>
              </div>
              <div className="flex flex-col gap-3">
                {matches.length === 0 ? (
                  <p className="text-dark-400 text-sm">No hay partidos próximos</p>
                ) : (
                  matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function MatchCard({ match }: { match: Match }) {
  const isLive = match.status === 'live'
  return (
    <div className="bg-dark-800/50 rounded-xl p-3 border border-dark-700/50">
      {isLive && (
        <div className="flex items-center gap-1 text-red-400 text-xs font-semibold mb-2 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> EN VIVO
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-white font-medium truncate">{match.home_team}</span>
        <div className="text-center shrink-0">
          {match.status === 'finished' || isLive ? (
            <span className="text-gold-400 font-bold text-sm">
              {match.home_score} - {match.away_score}
            </span>
          ) : (
            <span className="text-dark-400 text-xs flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDateShort(match.match_date)}
            </span>
          )}
        </div>
        <span className="text-sm text-white font-medium truncate text-right">{match.away_team}</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="gray">{match.group_name ? `Grupo ${match.group_name}` : PHASE_LABELS[match.phase]}</Badge>
      </div>
    </div>
  )
}
