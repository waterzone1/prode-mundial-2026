import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { usernameToEmail } from '@/lib/utils'
import { z } from 'zod'

const schema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password } = schema.parse(body)

    const supabase = createClient()
    const email = usernameToEmail(username)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al iniciar sesión' }, { status: 400 })
  }
}
