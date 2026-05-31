import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { determineWinner, isMatchLockedStrict } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  match_id: z.string().uuid(),
  predicted_home: z.number().int().min(0).max(20),
  predicted_away: z.number().int().min(0).max(20),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const body = await req.json()
    const { match_id, predicted_home, predicted_away } = schema.parse(body)

    const supabase = createClient()

    // Get match to check lock status
    const { data: match } = await supabase
      .from('matches')
      .select('match_date, status')
      .eq('id', match_id)
      .single()

    if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })
    if (match.status !== 'scheduled') {
      return NextResponse.json({ error: 'El partido ya empezó o finalizó' }, { status: 403 })
    }
    if (isMatchLockedStrict(match.match_date)) {
      return NextResponse.json({ error: 'Este partido está bloqueado (menos de 1 hora para el inicio)' }, { status: 403 })
    }

    const { error } = await supabase
      .from('live_predictions')
      .upsert({
        user_id: user.id,
        match_id,
        predicted_home,
        predicted_away,
        predicted_winner: determineWinner(predicted_home, predicted_away),
        locked: false,
      }, { onConflict: 'user_id,match_id' })

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al guardar' }, { status: 400 })
  }
}
