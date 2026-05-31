import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MatchManager } from '@/components/admin/MatchManager'
import type { Match } from '@/types'

export default async function MatchesPage() {
  try { await requireAdmin() } catch { redirect('/') }

  const supabase = createClient()
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .order('match_date', { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">Gestión de Partidos</h1>
        <p className="text-dark-400 text-sm mt-1">
          Cargá o corregí resultados manualmente. Los resultados actualizan los puntos automáticamente.
        </p>
      </div>
      <MatchManager matches={(matches || []) as Match[]} />
    </div>
  )
}
