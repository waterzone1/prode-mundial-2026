import { NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/api-auth'
import { recalculateAllScores } from '@/lib/scoring'

export async function POST(req: Request) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    await recalculateAllScores()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
