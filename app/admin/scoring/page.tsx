'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { ScoringRulesEditor } from '@/components/admin/ScoringRulesEditor'
import type { ScoringRule } from '@/types'

export default function ScoringPage() {
  const [rules, setRules] = useState<ScoringRule[]>([])

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    fetch(`${url}/rest/v1/scoring_rules?select=*&order=rule_name.asc`, {
      headers: { apikey: key!, Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => setRules(data || []))
  }, [])

  return (
    <AdminAuthGuard>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold text-white">Reglas de Puntuación</h1>
          <p className="text-dark-400 text-sm mt-1">
            Modificar los puntos recalcula automáticamente la tabla de posiciones.
          </p>
        </div>
        <ScoringRulesEditor rules={rules} />
      </div>
    </AdminAuthGuard>
  )
}
