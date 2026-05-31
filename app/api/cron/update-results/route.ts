import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchFixtures } from '@/lib/api-football'
import { calculateScoresForMatch } from '@/lib/scoring'

export const runtime = 'nodejs'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: Request) {
  // Validate cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getAdminClient()
    const fixtures = await fetchFixtures()

    let updated = 0
    let newMatches = 0
    const justFinished: string[] = []

    for (const fixture of fixtures) {
      if (!fixture.api_match_id) continue

      // Check if match already exists
      const { data: existing } = await supabase
        .from('matches')
        .select('id, status, home_score, away_score')
        .eq('api_match_id', fixture.api_match_id)
        .single()

      if (existing) {
        // Update if changed
        const changed =
          existing.status !== fixture.status ||
          existing.home_score !== fixture.home_score ||
          existing.away_score !== fixture.away_score

        if (changed) {
          await supabase
            .from('matches')
            .update({
              status: fixture.status,
              home_score: fixture.home_score,
              away_score: fixture.away_score,
              match_date: fixture.match_date,
            })
            .eq('id', existing.id)

          updated++

          // If match just finished, calculate scores
          if (fixture.status === 'finished' && existing.status !== 'finished') {
            justFinished.push(existing.id)
          }
        }
      } else {
        // Insert new match
        const { data: inserted } = await supabase
          .from('matches')
          .insert({
            api_match_id: fixture.api_match_id,
            home_team: fixture.home_team,
            away_team: fixture.away_team,
            match_date: fixture.match_date,
            phase: fixture.phase,
            group_name: fixture.group_name,
            home_score: fixture.home_score,
            away_score: fixture.away_score,
            status: fixture.status,
          })
          .select('id')
          .single()

        newMatches++

        if (fixture.status === 'finished' && inserted?.id) {
          justFinished.push(inserted.id)
        }
      }
    }

    // Calculate scores for newly finished matches
    for (const matchId of justFinished) {
      await calculateScoresForMatch(matchId)
    }

    // Log
    await supabase.from('activity_log').insert({
      action: 'cron_update_results',
      details: `API sync: ${updated} actualizados, ${newMatches} nuevos, ${justFinished.length} finalizados`,
    })

    return NextResponse.json({
      ok: true,
      updated,
      newMatches,
      scoresCalculated: justFinished.length,
    })
  } catch (e: any) {
    console.error('Cron error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
