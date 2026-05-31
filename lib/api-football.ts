import type { Match, MatchStatus } from '@/types'

const BASE_URL = 'https://v3.football.api-sports.io'

const headers = {
  'x-apisports-key': process.env.RAPIDAPI_KEY!,
}

interface APIFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; long: string }
  }
  league: {
    id: number
    name: string
    round: string
    group?: string
  }
  teams: {
    home: { id: number; name: string; logo: string }
    away: { id: number; name: string; logo: string }
  }
  goals: {
    home: number | null
    away: number | null
  }
}

function mapStatus(short: string): MatchStatus {
  if (['FT', 'AET', 'PEN'].includes(short)) return 'finished'
  if (['1H', '2H', 'HT', 'ET', 'P', 'LIVE'].includes(short)) return 'live'
  if (['PST', 'CANC', 'ABD'].includes(short)) return 'postponed'
  return 'scheduled'
}

function mapPhase(round: string): string {
  const r = round.toLowerCase()
  if (r.includes('group')) return 'group'
  if (r.includes('32') || r.includes('round of 32')) return 'round_of_32'
  if (r.includes('16') || r.includes('round of 16')) return 'round_of_16'
  if (r.includes('quarter')) return 'quarter_final'
  if (r.includes('semi')) return 'semi_final'
  if (r.includes('3rd') || r.includes('third')) return 'third_place'
  if (r.includes('final')) return 'final'
  return 'group'
}

export async function fetchFixtures(): Promise<Partial<Match>[]> {
  const leagueId = process.env.WORLD_CUP_LEAGUE_ID || '1'
  const season = process.env.WORLD_CUP_SEASON || '2026'

  const url = `${BASE_URL}/fixtures?league=${leagueId}&season=${season}`
  const res = await fetch(url, { headers, next: { revalidate: 0 } })

  if (!res.ok) {
    throw new Error(`API-Football error: ${res.status} ${res.statusText}`)
  }

  const json = await res.json()
  const fixtures: APIFixture[] = json.response || []

  return fixtures.map((f) => ({
    api_match_id: f.fixture.id,
    home_team: f.teams.home.name,
    away_team: f.teams.away.name,
    match_date: f.fixture.date,
    phase: mapPhase(f.league.round) as Match['phase'],
    group_name: f.league.group || null,
    home_score: f.goals.home,
    away_score: f.goals.away,
    status: mapStatus(f.fixture.status.short),
  }))
}

export async function fetchLiveFixtures(): Promise<Partial<Match>[]> {
  const leagueId = process.env.WORLD_CUP_LEAGUE_ID || '1'
  const url = `${BASE_URL}/fixtures?league=${leagueId}&live=all`
  const res = await fetch(url, { headers, next: { revalidate: 0 } })
  if (!res.ok) return []
  const json = await res.json()
  const fixtures: APIFixture[] = json.response || []
  return fixtures.map((f) => ({
    api_match_id: f.fixture.id,
    home_score: f.goals.home,
    away_score: f.goals.away,
    status: mapStatus(f.fixture.status.short),
  }))
}
