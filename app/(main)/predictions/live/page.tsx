import { createClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { LivePredictionsView } from '@/components/predictions/LivePredictionsView'
import type { Match, LivePrediction } from '@/types'

export const revalidate = 30

export default async function LivePredictionsPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createClient()

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true }),
    supabase
      .from('live_predictions')
      .select('*')
      .eq('user_id', user.id),
  ])

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">🎯 Pronósticos en Vivo</h1>
        <p className="text-dark-400 mt-1 text-sm">
          Podés modificar tus pronósticos hasta 1 hora antes de cada partido.
          Los partidos en curso o finalizados están bloqueados.
        </p>
      </div>

      <LivePredictionsView
        userId={user.id}
        matches={(matches || []) as Match[]}
        predictions={(predictions || []) as LivePrediction[]}
      />
    </div>
  )
}
