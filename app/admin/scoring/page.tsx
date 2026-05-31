import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ScoringRulesEditor } from '@/components/admin/ScoringRulesEditor'
import type { ScoringRule } from '@/types'

export default async function ScoringPage() {
  try { await requireAdmin() } catch { redirect('/') }

  const supabase = createClient()
  const { data: rules } = await supabase.from('scoring_rules').select('*').order('rule_name')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-white">Reglas de Puntuación</h1>
        <p className="text-dark-400 text-sm mt-1">
          Modificar los puntos recalcula automáticamente la tabla de posiciones.
        </p>
      </div>
      <ScoringRulesEditor rules={(rules || []) as ScoringRule[]} />
    </div>
  )
}
