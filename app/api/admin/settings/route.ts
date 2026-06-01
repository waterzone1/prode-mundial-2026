import { NextResponse } from 'next/server'
import { verifyAdmin, getAdminClient } from '@/lib/api-auth'
import { z } from 'zod'

const schema = z.object({
  key: z.string(),
  value: z.string(),
})

export async function POST(req: Request) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await req.json()
    const { key, value } = schema.parse(body)

    const admin = getAdminClient()
    const { error } = await admin
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
