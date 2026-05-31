import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser, isInitialPredictionOpen } from '@/lib/auth'
import { determineWinner } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  predictions: z.array(z.object({
    match_id: z.string().uuid(),
    predicted_home: z.number().int().min(0).max(20),
    predicted_away: z.number().int().min(0).max(20),
  })),
  champion: z.string().min(1),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const isOpen = await isInitialPredictionOpen()
    if (!isOpen) return NextResponse.json({ error: 'El período de pronóstico inicial está cerrado' }, { status: 403 })

    const body = await req.json()
    const { predictions, champion } = schema.parse(body)

    const supabase = createClient()

    // Upsert predictions
    const rows = predictions.map((p) => ({
      user_id: user.id,
      match_id: p.match_id,
      predicted_home: p.predicted_home,
      predicted_away: p.predicted_away,
      predicted_winner: determineWinner(p.predicted_home, p.predicted_away),
    }))

    const { error: predError } = await supabase
      .from('initial_predictions')
      .upsert(rows, { onConflict: 'user_id,match_id' })

    if (predError) throw predError

    // Upsert champion
    const { error: champError } = await supabase
      .from('champion_prediction')
      .upsert({ user_id: user.id, team: champion }, { onConflict: 'user_id' })

    if (champError) throw champError

    await supabase.from('activity_log').insert({
      action: 'submit_initial_prediction',
      user_id: user.id,
      details: `Pronóstico inicial guardado (${predictions.length} partidos, campeón: ${champion})`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al guardar' }, { status: 400 })
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const supabase = createClient()
    const [{ data: predictions }, { data: champion }] = await Promise.all([
      supabase.from('initial_predictions').select('*').eq('user_id', user.id),
      supabase.from('champion_prediction').select('*').eq('user_id', user.id).single(),
    ])

    return NextResponse.json({ predictions, champion })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
