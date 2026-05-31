import { createClient as createServiceClient } from '@supabase/supabase-js'
import { determineWinner } from '@/lib/utils'
import type { Match, ScoringRule, PredictedWinner } from '@/types'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

interface RulesMap {
  [key: string]: { points: number; active: boolean }
}

async function getScoringRules(): Promise<RulesMap> {
  const supabase = getServiceClient()
  const { data } = await supabase.from('scoring_rules').select('*')
  const map: RulesMap = {}
  for (const rule of data || []) {
    map[rule.rule_name] = { points: rule.points, active: rule.active }
  }
  return map
}

export async function calculateScoresForMatch(matchId: string) {
  const supabase = getServiceClient()
  const rules = await getScoringRules()

  const { data: match } = await supabase
    .from('matches')
    .select('*')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'finished') return

  const actualWinner = determineWinner(match.home_score, match.away_score)

  const { data: livePreds } = await supabase
    .from('live_predictions')
    .select('*')
    .eq('match_id', matchId)

  for (const pred of livePreds || []) {
    let basePoints = 0

    const predWinner = determineWinner(pred.predicted_home, pred.predicted_away)

    if (predWinner === actualWinner && rules.correct_winner?.active) {
      basePoints += rules.correct_winner.points
    }

    if (
      pred.predicted_home === match.home_score &&
      pred.predicted_away === match.away_score &&
      rules.exact_result?.active
    ) {
      basePoints += rules.exact_result.points
    }

    // Update or create score record
    await supabase.rpc('add_base_points', {
      p_user_id: pred.user_id,
      p_match_id: matchId,
      p_points: basePoints,
      p_is_exact: pred.predicted_home === match.home_score && pred.predicted_away === match.away_score,
      p_is_winner: predWinner === actualWinner,
    })

    // Calculate chain bonuses
    await calculateChainBonus(pred.user_id, match, rules)
  }

  // Streak bonus
  if (rules.streak_bonus?.active) {
    await calculateStreakBonuses(rules.streak_bonus.points)
  }
}

async function calculateChainBonus(
  userId: string,
  match: Match,
  rules: RulesMap
) {
  const supabase = getServiceClient()
  const actualWinner = determineWinner(match.home_score!, match.away_score!)

  // Get initial prediction for this match
  const { data: initPred } = await supabase
    .from('initial_predictions')
    .select('*')
    .eq('user_id', userId)
    .eq('match_id', match.id)
    .single()

  if (!initPred) return

  const initWinner = determineWinner(initPred.predicted_home, initPred.predicted_away)

  // Group stage: bonus for classifier if both teams' predictions were correct
  if (match.phase === 'group' && match.group_name) {
    await checkGroupClassifierBonus(userId, match, rules)
  }

  // Knockout phases: bonus for correct matchup prediction
  if (match.phase !== 'group') {
    await checkKnockoutMatchupBonus(userId, match, rules)

    // Bonus for correct knockout winner
    if (initWinner === actualWinner && rules.chain_knockout_winner?.active) {
      const existing = await supabase
        .from('chain_bonus_log')
        .select('id')
        .eq('user_id', userId)
        .eq('match_id', match.id)
        .eq('bonus_type', 'chain_knockout_winner')
        .single()

      if (!existing.data) {
        await awardChainBonus(userId, match.id, 'chain_knockout_winner', rules.chain_knockout_winner.points)
      }
    }
  }
}

async function checkGroupClassifierBonus(
  userId: string,
  match: Match,
  rules: RulesMap
) {
  if (!rules.chain_group_classifier?.active) return
  const supabase = getServiceClient()

  // Get all group matches and initial predictions for this group
  const { data: groupMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('group_name', match.group_name)
    .eq('phase', 'group')
    .eq('status', 'finished')

  if (!groupMatches) return

  const allMatchIds = groupMatches.map((m) => m.id)

  const { data: initPreds } = await supabase
    .from('initial_predictions')
    .select('*')
    .eq('user_id', userId)
    .in('match_id', allMatchIds)

  // Only check when all group matches are finished
  const { data: allGroupMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('group_name', match.group_name)
    .eq('phase', 'group')

  if (allGroupMatches?.length !== groupMatches.length) return

  // Calculate actual standings
  const actualStandings = calculateGroupStandings(groupMatches)
  const predictedStandings = calculateGroupStandings(
    groupMatches.map((m) => {
      const pred = initPreds?.find((p) => p.match_id === m.id)
      return pred
        ? { ...m, home_score: pred.predicted_home, away_score: pred.predicted_away }
        : m
    })
  )

  // Check if top 2 qualifiers match
  const actualTop2 = actualStandings.slice(0, 2).map((s) => s.team)
  const predictedTop2 = predictedStandings.slice(0, 2).map((s) => s.team)

  const correct1st =
    actualStandings[0]?.team === predictedStandings[0]?.team
  const correct2nd =
    actualStandings[1]?.team === predictedStandings[1]?.team

  const bonusKey = `chain_group_${match.group_name}_classifier`
  const existing = await supabase
    .from('chain_bonus_log')
    .select('id')
    .eq('user_id', userId)
    .eq('bonus_type', bonusKey)
    .single()

  if (!existing.data && (correct1st || correct2nd)) {
    const matches = [correct1st, correct2nd].filter(Boolean).length
    await awardChainBonus(
      userId,
      match.id,
      bonusKey,
      rules.chain_group_classifier.points * matches
    )
  }
}

async function checkKnockoutMatchupBonus(
  userId: string,
  match: Match,
  rules: RulesMap
) {
  const ruleKey = `chain_${match.phase}_matchup` as keyof typeof rules
  if (!rules[ruleKey]?.active) return
  const supabase = getServiceClient()

  // Check if user's initial bracket predicted this exact matchup
  const { data: bracket } = await supabase
    .from('initial_bracket')
    .select('*')
    .eq('user_id', userId)
    .eq('phase', match.phase)

  if (!bracket || bracket.length === 0) return

  const predictedTeams = bracket.map((b: { predicted_team: string }) => b.predicted_team)
  const bothTeamsCorrect =
    predictedTeams.includes(match.home_team) &&
    predictedTeams.includes(match.away_team)

  if (bothTeamsCorrect) {
    const bonusKey = `chain_${match.phase}_matchup_${match.id}`
    const existing = await supabase
      .from('chain_bonus_log')
      .select('id')
      .eq('user_id', userId)
      .eq('bonus_type', bonusKey)
      .single()

    if (!existing.data) {
      await awardChainBonus(userId, match.id, bonusKey, rules[ruleKey]!.points)
    }
  }
}

async function calculateStreakBonuses(bonusPoints: number) {
  const supabase = getServiceClient()
  const { data: users } = await supabase.from('profiles').select('id')

  for (const user of users || []) {
    const { data: preds } = await supabase
      .from('live_predictions')
      .select('*, matches!inner(status, home_score, away_score, match_date)')
      .eq('user_id', user.id)
      .eq('matches.status', 'finished')
      .order('matches.match_date', { ascending: true })

    let streak = 0
    let totalStreakBonus = 0

    for (const pred of preds || []) {
      const match = (pred as any).matches
      const predWinner = determineWinner(pred.predicted_home, pred.predicted_away)
      const actualWinner = determineWinner(match.home_score, match.away_score)
      const isExact =
        pred.predicted_home === match.home_score &&
        pred.predicted_away === match.away_score

      if (isExact || predWinner === actualWinner) {
        streak++
        if (streak >= 3) totalStreakBonus += bonusPoints
      } else {
        streak = 0
      }
    }

    if (totalStreakBonus > 0) {
      await supabase
        .from('scores')
        .upsert({
          user_id: user.id,
          streak_bonus: totalStreakBonus,
        }, { onConflict: 'user_id' })
    }
  }
}

async function awardChainBonus(
  userId: string,
  matchId: string,
  bonusType: string,
  points: number
) {
  const supabase = getServiceClient()
  await supabase.from('chain_bonus_log').insert({
    user_id: userId,
    match_id: matchId,
    bonus_type: bonusType,
    points_awarded: points,
  })

  await supabase.rpc('add_chain_bonus', {
    p_user_id: userId,
    p_points: points,
  })
}

interface GroupMatch {
  home_team: string
  away_team: string
  home_score: number | null
  away_score: number | null
}

interface GroupStanding {
  team: string
  pts: number
  gd: number
  gf: number
}

function calculateGroupStandings(matches: GroupMatch[]): GroupStanding[] {
  const teams: Record<string, GroupStanding> = {}

  for (const m of matches) {
    if (!teams[m.home_team]) teams[m.home_team] = { team: m.home_team, pts: 0, gd: 0, gf: 0 }
    if (!teams[m.away_team]) teams[m.away_team] = { team: m.away_team, pts: 0, gd: 0, gf: 0 }

    if (m.home_score === null || m.away_score === null) continue

    const hg = m.home_score
    const ag = m.away_score

    teams[m.home_team].gf += hg
    teams[m.away_team].gf += ag
    teams[m.home_team].gd += hg - ag
    teams[m.away_team].gd += ag - hg

    if (hg > ag) {
      teams[m.home_team].pts += 3
    } else if (hg === ag) {
      teams[m.home_team].pts += 1
      teams[m.away_team].pts += 1
    } else {
      teams[m.away_team].pts += 3
    }
  }

  return Object.values(teams).sort((a, b) =>
    b.pts - a.pts || b.gd - a.gd || b.gf - a.gf
  )
}

export async function recalculateAllScores() {
  const supabase = getServiceClient()

  // Reset all scores
  await supabase.from('scores').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('chain_bonus_log').delete().neq('id', '00000000-0000-0000-0000-000000000000')

  // Re-process all finished matches in order
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished')
    .order('match_date', { ascending: true })

  for (const match of matches || []) {
    await calculateScoresForMatch(match.id)
  }

  await supabase.from('activity_log').insert({
    action: 'recalculate_scores',
    details: `Recálculo completo de puntos ejecutado`,
  })
}
