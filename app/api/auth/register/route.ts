import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { usernameToEmail } from '@/lib/utils'
import { z } from 'zod'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const schema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = schema.parse(body)

    const supabase = createClient()

    // Check if registration is enabled
    const { data: setting } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'registration_enabled')
      .single()

    if (setting?.value === 'false') {
      return NextResponse.json({ error: 'El registro está deshabilitado momentáneamente' }, { status: 403 })
    }

    // Check username availability
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Ese nombre de usuario ya está en uso' }, { status: 400 })
    }

    const email = usernameToEmail(username)

    // Use admin client to create user (bypasses email confirmation)
    const adminClient = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Determine role: first user is admin
    const { count } = await adminClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const role = count === 0 ? 'admin' : 'user'

    const { data: authData, error: signUpError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (signUpError || !authData.user) {
      return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
    }

    // Create profile
    await adminClient.from('profiles').insert({
      id: authData.user.id,
      username: username.toLowerCase(),
      role,
    })

    // Initialize score record
    await adminClient.from('scores').insert({
      user_id: authData.user.id,
      base_points: 0,
      chain_bonus_points: 0,
      total_points: 0,
      exact_results: 0,
      correct_winners: 0,
    })

    // Log activity
    await adminClient.from('activity_log').insert({
      action: 'register',
      user_id: authData.user.id,
      details: `Nuevo usuario registrado: ${username}`,
    })

    // Sign in the user in the current session
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      return NextResponse.json({ error: 'Cuenta creada pero error al iniciar sesión' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, role })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al registrarse' }, { status: 400 })
  }
}
