import { NextResponse } from 'next/server'
import { verifyAdmin, getAdminClient } from '@/lib/api-auth'
import { z } from 'zod'

const schema = z.object({
  id: z.string().uuid(),
  points: z.number().int().min(0).max(100),
  active: z.boolean(),
})

export async function PATCH(req: Request) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { id, points, active } = schema.parse(body)

    const admin = getAdminClient()
    const { error } = await admin
      .from('scoring_rules')
      .update({ points, active, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
