'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { Card } from '@/components/ui/Card'
import { ActivityLog } from '@/components/admin/ActivityLog'
import { AdminActions } from '@/components/admin/AdminActions'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, matches: 0, predictions: 0 })
  const [activity, setActivity] = useState<any[]>([])
  const [settings, setSettings] = useState<any[]>([])

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const headers = { apikey: key!, Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${url}/rest/v1/profiles?select=id`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/matches?select=id`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/live_predictions?select=id`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/activity_log?select=*,profiles(username)&order=created_at.desc&limit=20`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/settings?select=*`, { headers }).then(r => r.json()),
    ]).then(([users, matches, preds, logs, sets]) => {
      setStats({ users: users?.length || 0, matches: matches?.length || 0, predictions: preds?.length || 0 })
      setActivity(logs || [])
      setSettings(sets || [])
    })
  }, [])

  const registrationEnabled = settings.find(s => s.key === 'registration_enabled')?.value !== 'false'
  const deadline = settings.find(s => s.key === 'initial_prediction_deadline')?.value || ''

  return (
    <AdminAuthGuard>
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold text-white">Panel de Control</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard emoji="👥" label="Usuarios" value={stats.users} />
          <StatCard emoji="⚽" label="Partidos" value={stats.matches} />
          <StatCard emoji="🎯" label="Pronósticos" value={stats.predictions} />
          <StatCard emoji="✅" label="Sistema" value="OK" />
        </div>
        <AdminActions registrationEnabled={registrationEnabled} initialDeadline={deadline} />
        <Card>
          <h2 className="font-semibold text-white mb-4">Actividad Reciente</h2>
          <ActivityLog logs={activity} />
        </Card>
      </div>
    </AdminAuthGuard>
  )
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: number | string }) {
  return (
    <Card>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-gold-400">{value}</div>
      <div className="text-xs text-dark-400">{label}</div>
    </Card>
  )
}
