'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'
import { RULE_LABELS } from '@/types'
import type { ScoringRule } from '@/types'
import { Save } from 'lucide-react'

interface Props {
  rules: ScoringRule[]
}

export function ScoringRulesEditor({ rules: initialRules }: Props) {
  const { toast } = useToast()
  const [rules, setRules] = useState(initialRules)
  const [saving, setSaving] = useState<string | null>(null)

  const getToken = () => JSON.parse(localStorage.getItem('supabase-session') || '{}').access_token || ''

  const updateRule = async (rule: ScoringRule) => {
    setSaving(rule.id)
    try {
      const res = await fetch('/api/admin/scoring', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ id: rule.id, points: rule.points, active: rule.active }),
      })
      if (!res.ok) throw new Error('Error')
      toast('Regla actualizada. Recalculando puntos...', 'success')

      await fetch('/api/admin/recalculate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      })
      toast('Puntos recalculados ✓', 'gold')
    } catch {
      toast('Error al guardar', 'error')
    } finally {
      setSaving(null)
    }
  }

  const setPoints = (id: string, points: number) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, points } : r))
  }
  const setActive = (id: string, active: boolean) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, active } : r))
  }

  const baseRules = rules.filter((r) => !r.rule_name.startsWith('chain_'))
  const chainRules = rules.filter((r) => r.rule_name.startsWith('chain_'))

  return (
    <div className="flex flex-col gap-4">
      <RulesSection
        title="Puntos Base (Capa 2 — Pronósticos en Vivo)"
        rules={baseRules}
        saving={saving}
        onPointsChange={setPoints}
        onActiveChange={setActive}
        onSave={updateRule}
      />
      <RulesSection
        title="Bonus de Cadena (Capa 1 — Pronóstico Inicial)"
        rules={chainRules}
        saving={saving}
        onPointsChange={setPoints}
        onActiveChange={setActive}
        onSave={updateRule}
      />
    </div>
  )
}

function RulesSection({
  title, rules, saving, onPointsChange, onActiveChange, onSave
}: {
  title: string
  rules: ScoringRule[]
  saving: string | null
  onPointsChange: (id: string, pts: number) => void
  onActiveChange: (id: string, active: boolean) => void
  onSave: (rule: ScoringRule) => void
}) {
  return (
    <Card>
      <h2 className="font-semibold text-white mb-4">{title}</h2>
      <div className="flex flex-col gap-3">
        {rules.map((rule) => (
          <div key={rule.id} className="flex items-center gap-3 py-2 border-b border-dark-800/50">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rule.active}
                onChange={(e) => onActiveChange(rule.id, e.target.checked)}
                className="w-4 h-4 accent-gold-500 rounded"
              />
              <span className={`text-sm ${rule.active ? 'text-white' : 'text-dark-500 line-through'}`}>
                {RULE_LABELS[rule.rule_name] || rule.rule_name}
              </span>
            </label>
            <div className="ml-auto flex items-center gap-2">
              <input
                type="number"
                min="0" max="100"
                value={rule.points}
                onChange={(e) => onPointsChange(rule.id, parseInt(e.target.value) || 0)}
                className="w-16 text-center input-dark py-1 text-sm"
                disabled={!rule.active}
              />
              <span className="text-dark-500 text-sm">pts</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onSave(rule)}
                loading={saving === rule.id}
              >
                <Save className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
