export type UserRole = 'admin' | 'user'

export interface Profile {
  id: string
  username: string
  role: UserRole
  created_at: string
}

export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed'
export type MatchPhase =
  | 'group'
  | 'round_of_32'
  | 'round_of_16'
  | 'quarter_final'
  | 'semi_final'
  | 'third_place'
  | 'final'

export interface Match {
  id: string
  api_match_id: number | null
  home_team: string
  away_team: string
  match_date: string
  phase: MatchPhase
  group_name: string | null
  home_score: number | null
  away_score: number | null
  status: MatchStatus
  home_flag?: string
  away_flag?: string
}

export type PredictedWinner = 'home' | 'away' | 'draw'

export interface InitialPrediction {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  predicted_winner: PredictedWinner
  submitted_at: string
}

export interface InitialBracket {
  id: string
  user_id: string
  phase: MatchPhase
  slot: number
  predicted_team: string
  submitted_at: string
}

export interface ChampionPrediction {
  id: string
  user_id: string
  team: string
  created_at: string
}

export interface LivePrediction {
  id: string
  user_id: string
  match_id: string
  predicted_home: number
  predicted_away: number
  predicted_winner: PredictedWinner
  locked: boolean
  updated_at: string
}

export interface ScoringRule {
  id: string
  rule_name: string
  points: number
  active: boolean
  updated_at: string
}

export interface Score {
  id: string
  user_id: string
  base_points: number
  chain_bonus_points: number
  total_points: number
  exact_results: number
  correct_winners: number
  updated_at: string
  profiles?: Profile
}

export interface ChainBonusLog {
  id: string
  user_id: string
  match_id: string
  bonus_type: string
  points_awarded: number
  created_at: string
}

export interface AppSetting {
  id: string
  key: string
  value: string
  updated_at: string
}

export interface ActivityLog {
  id: string
  action: string
  user_id: string | null
  details: string | null
  created_at: string
  profiles?: Profile
}

export interface StandingsRow {
  rank: number
  prev_rank: number | null
  user_id: string
  username: string
  total_points: number
  base_points: number
  chain_bonus_points: number
  exact_results: number
  correct_winners: number
  accuracy: number
}

export interface MatchStats {
  match: Match
  total_predictions: number
  home_wins: number
  draws: number
  away_wins: number
  exact_correct: number
  winner_correct: number
  most_popular_score: string
}

export const SCORING_RULES = {
  correct_winner: 'correct_winner',
  exact_result: 'exact_result',
  knockout_advance: 'knockout_advance',
  champion: 'champion',
  streak_bonus: 'streak_bonus',
  chain_group_classifier: 'chain_group_classifier',
  chain_r32_matchup: 'chain_r32_matchup',
  chain_r16_matchup: 'chain_r16_matchup',
  chain_qf_matchup: 'chain_qf_matchup',
  chain_sf_matchup: 'chain_sf_matchup',
  chain_final_matchup: 'chain_final_matchup',
  chain_knockout_winner: 'chain_knockout_winner',
  chain_full_path: 'chain_full_path',
} as const

export const PHASE_LABELS: Record<MatchPhase, string> = {
  group: 'Fase de Grupos',
  round_of_32: 'Ronda de 32',
  round_of_16: 'Octavos de Final',
  quarter_final: 'Cuartos de Final',
  semi_final: 'Semifinales',
  third_place: 'Tercer Puesto',
  final: 'Final',
}

export const DEFAULT_SCORING: Record<string, number> = {
  correct_winner: 2,
  exact_result: 3,
  knockout_advance: 3,
  champion: 10,
  streak_bonus: 1,
  chain_group_classifier: 2,
  chain_r32_matchup: 3,
  chain_r16_matchup: 4,
  chain_qf_matchup: 5,
  chain_sf_matchup: 6,
  chain_final_matchup: 8,
  chain_knockout_winner: 3,
  chain_full_path: 5,
}

export const RULE_LABELS: Record<string, string> = {
  correct_winner: 'Ganador correcto (1/X/2)',
  exact_result: 'Resultado exacto',
  knockout_advance: 'Equipo que avanza en eliminatorias',
  champion: 'Campeón del torneo',
  streak_bonus: 'Bonus por racha de aciertos consecutivos',
  chain_group_classifier: 'Bonus cadena: clasificado de grupo correcto',
  chain_r32_matchup: 'Bonus cadena: cruce en Ronda 32 correcto',
  chain_r16_matchup: 'Bonus cadena: cruce en Octavos correcto',
  chain_qf_matchup: 'Bonus cadena: cruce en Cuartos correcto',
  chain_sf_matchup: 'Bonus cadena: cruce en Semis correcto',
  chain_final_matchup: 'Bonus cadena: cruce en Final correcto',
  chain_knockout_winner: 'Bonus cadena: ganador de llave en eliminatorias',
  chain_full_path: 'Bonus cadena: camino completo de equipo',
}

export const WORLD_CUP_GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const

export const KNOCKOUT_PHASES: MatchPhase[] = [
  'round_of_32','round_of_16','quarter_final','semi_final','final','third_place'
]
