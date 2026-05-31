import { createClient } from '@/lib/supabase/server'
import { usernameToEmail } from '@/lib/utils'
import type { Profile } from '@/types'

export async function getSession() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

export async function requireAuth(): Promise<Profile> {
  const user = await getCurrentUser()
  if (!user) throw new Error('No autenticado')
  return user
}

export async function requireAdmin(): Promise<Profile> {
  const user = await requireAuth()
  if (user.role !== 'admin') throw new Error('Acceso denegado: se requiere rol admin')
  return user
}

export async function isRegistrationEnabled(): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'registration_enabled')
    .single()
  return data?.value !== 'false'
}

export async function getInitialPredictionDeadline(): Promise<Date | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'initial_prediction_deadline')
    .single()
  if (!data?.value) return null
  return new Date(data.value)
}

export async function isInitialPredictionOpen(): Promise<boolean> {
  const deadline = await getInitialPredictionDeadline()
  if (!deadline) return true
  return new Date() < deadline
}
