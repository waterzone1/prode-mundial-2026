'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { ScoringRulesEditor } from '@/components/admin/ScoringRulesEditor'
import { sbFetch } from '@/lib/supabase/fetch'
import type { ScoringRule } from '@/types'

export default function ScoringPage() {
  const [rules, setRules] = useState<ScoringRule[]>([])

  useEffect(() => {
    sbFetch('scoring_rules', 'select=*&order=rule_name.asc').then(data => setRules(data || []))
  }, [])

  return (
    <AdminAuthGuard>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white">Reglas de Puntuación</h1>
          <p className="text-dark-400 text-sm mt-1">Modificar los puntos recalcula la tabla automáticamente.</p>
        </div>
        <ScoringRulesEditor rules={rules} />
      </div>
    </AdminAuthGuard>
  )
}
