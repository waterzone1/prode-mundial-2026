import { NextResponse } from 'next/server'
import { verifyAdmin, getAdminClient } from '@/lib/api-auth'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: Request) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { user_id, role } = await req.json()
    if (!user_id || !['admin', 'user'].includes(role)) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    const admin = getAdminClient()
    const { error } = await admin.from('profiles').update({ role }).eq('id', user_id)
    if (error) throw error

    await admin.from('activity_log').insert({
      action: 'change_role',
      user_id: user.id,
      details: `Rol cambiado a ${role} para user ${user_id}`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await verifyAdmin(req)
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const { user_id } = await req.json()
    if (!user_id) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })

    const admin = getAdminClient()
    await Promise.all([
      admin.from('live_predictions').delete().eq('user_id', user_id),
      admin.from('initial_predictions').delete().eq('user_id', user_id),
      admin.from('initial_bracket').delete().eq('user_id', user_id),
      admin.from('champion_prediction').delete().eq('user_id', user_id),
      admin.from('chain_bonus_log').delete().eq('user_id', user_id),
      admin.from('scores').delete().eq('user_id', user_id),
    ])
    await admin.from('profiles').delete().eq('id', user_id)
    await admin.auth.admin.deleteUser(user_id)

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
