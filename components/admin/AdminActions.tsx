'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useToast } from '@/components/providers/ToastProvider'
import { RotateCcw, UserCheck, UserX, Calendar } from 'lucide-react'

interface Props {
  registrationEnabled: boolean
  initialDeadline: string
}

export function AdminActions({ registrationEnabled, initialDeadline }: Props) {
  const { toast } = useToast()
  const [regEnabled, setRegEnabled] = useState(registrationEnabled)
  const [deadline, setDeadline] = useState(initialDeadline)
  const [recalcLoading, setRecalcLoading] = useState(false)
  const [settingLoading, setSettingLoading] = useState(false)

  const getToken = () => JSON.parse(localStorage.getItem('supabase-session') || '{}').access_token || ''

  const toggleRegistration = async () => {
    setSettingLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ key: 'registration_enabled', value: String(!regEnabled) }),
      })
      if (!res.ok) throw new Error('Error')
      setRegEnabled(!regEnabled)
      toast(`Registro ${!regEnabled ? 'habilitado' : 'deshabilitado'}`, 'success')
    } catch {
      toast('Error al cambiar configuración', 'error')
    } finally {
      setSettingLoading(false)
    }
  }

  const saveDeadline = async () => {
    setSettingLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
        body: JSON.stringify({ key: 'initial_prediction_deadline', value: deadline }),
      })
      if (!res.ok) throw new Error('Error')
      toast('Fecha de cierre guardada', 'success')
    } catch {
      toast('Error al guardar fecha', 'error')
    } finally {
      setSettingLoading(false)
    }
  }

  const recalculate = async () => {
    if (!confirm('¿Recalcular TODOS los puntos? Esto puede tardar unos segundos.')) return
    setRecalcLoading(true)
    try {
      const res = await fetch('/api/admin/recalculate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      })
      if (!res.ok) throw new Error('Error')
      toast('Puntos recalculados correctamente ✓', 'success')
    } catch {
      toast('Error en el recálculo', 'error')
    } finally {
      setRecalcLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold-400" /> Cierre Pronóstico Inicial
        </h3>
        <div className="flex gap-2">
          <input
            type="datetime-local"
            className="input-dark flex-1 text-sm"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <Button size="sm" onClick={saveDeadline} loading={settingLoading}>
            Guardar
          </Button>
        </div>
        <p className="text-xs text-dark-500 mt-2">Dejá vacío para mantener abierto indefinidamente.</p>
      </Card>

      <Card>
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          {regEnabled ? <UserCheck className="w-4 h-4 text-green-400" /> : <UserX className="w-4 h-4 text-red-400" />}
          Registro de usuarios
        </h3>
        <p className="text-sm text-dark-400 mb-3">
          Estado: <span className={regEnabled ? 'text-green-400' : 'text-red-400'}>
            {regEnabled ? 'Habilitado' : 'Deshabilitado'}
          </span>
        </p>
        <Button
          variant={regEnabled ? 'danger' : 'outline'}
          size="sm"
          onClick={toggleRegistration}
          loading={settingLoading}
        >
          {regEnabled ? 'Deshabilitar registro' : 'Habilitar registro'}
        </Button>
      </Card>

      <Card className="md:col-span-2">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-gold-400" /> Recálculo Global de Puntos
        </h3>
        <p className="text-sm text-dark-400 mb-3">
          Recalcula todos los puntos para todos los usuarios desde cero, basándose en las reglas actuales.
          Usá esto cuando modifiques las reglas de puntuación.
        </p>
        <Button variant="outline" onClick={recalculate} loading={recalcLoading}>
          <RotateCcw className="w-4 h-4" /> Recalcular todos los puntos
        </Button>
      </Card>
    </div>
  )
}
