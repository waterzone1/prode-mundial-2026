import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
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

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

export async function PATCH(req: Request) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const data = updateSchema.parse(body)
    const { id, ...updates } = data

    const admin = getAdminClient()
    const { data: before } = await admin.from('matches').select('status').eq('id', id).single()
    const { error } = await admin.from('matches').update(updates).eq('id', id)
    if (error) throw error

    if (updates.status === 'finished' && before?.status !== 'finished') {
      await calculateScoresForMatch(id)
    }

    await admin.from('activity_log').insert({
      action: 'update_match',
      user_id: user.id,
      details: `Partido ${id} actualizado: ${JSON.stringify(updates)}`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const data = createSchema.parse(body)

    const admin = getAdminClient()
    const { data: match, error } = await admin.from('matches').insert(data).select().single()
    if (error) throw error

    return NextResponse.json({ ok: true, match })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
