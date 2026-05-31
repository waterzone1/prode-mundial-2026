import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  key: z.string(),
  value: z.string(),
})

export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()
    const { key, value } = schema.parse(body)

    const supabase = createClient()
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
