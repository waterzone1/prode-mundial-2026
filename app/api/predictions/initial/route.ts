import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    const token = authHeader.replace('Bearer ', '')
    const supabase = getSupabase(token)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Verificar deadline
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'initial_prediction_deadline')
      .single()

    if (setting?.value && new Date() > new Date(setting.value)) {
      return NextResponse.json({ error: 'El período de pronóstico inicial está cerrado' }, { status: 403 })
    }

    const body = await req.json()
    const { predictions, champion } = schema.parse(body)

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
