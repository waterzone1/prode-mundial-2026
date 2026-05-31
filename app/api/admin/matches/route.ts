import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { calculateScoresForMatch } from '@/lib/scoring'
import { z } from 'zod'

const updateSchema = z.object({
  id: z.string().uuid(),
  home_score: z.number().int().min(0).max(20).optional(),
  away_score: z.number().int().min(0).max(20).optional(),
  status: z.enum(['scheduled', 'live', 'finished', 'postponed']).optional(),
})

const createSchema = z.object({
  home_team: z.string().min(1),
  away_team: z.string().min(1),
  match_date: z.string(),
  phase: z.enum(['group','round_of_32','round_of_16','quarter_final','semi_final','third_place','final']),
  group_name: z.string().optional(),
  status: z.enum(['scheduled', 'live', 'finished', 'postponed']).default('scheduled'),
})

export async function PATCH(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = updateSchema.parse(body)
    const { id, ...updates } = data

    const supabase = createClient()

    // Check if was not finished before
    const { data: before } = await supabase.from('matches').select('status').eq('id', id).single()

    const { error } = await supabase.from('matches').update(updates).eq('id', id)
    if (error) throw error

    // If just marked as finished, calculate scores
    if (updates.status === 'finished' && before?.status !== 'finished') {
      await calculateScoresForMatch(id)
    }

    await supabase.from('activity_log').insert({
      action: 'update_match',
      details: `Partido ${id} actualizado manualmente: ${JSON.stringify(updates)}`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const data = createSchema.parse(body)

    const supabase = createClient()
    const { data: match, error } = await supabase
      .from('matches')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ ok: true, match })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
