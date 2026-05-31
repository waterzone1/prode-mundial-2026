import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { recalculateAllScores } from '@/lib/scoring'

export async function POST() {
  try {
    await requireAdmin()
    await recalculateAllScores()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
