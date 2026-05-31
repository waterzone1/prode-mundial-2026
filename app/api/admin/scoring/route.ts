import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  id: z.string().uuid(),
  points: z.number().int().min(0).max(100),
  active: z.boolean(),
})

export async function PATCH(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { id, points, active } = schema.parse(body)

    const supabase = createClient()
    const { error } = await supabase
      .from('scoring_rules')
      .update({ points, active, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
