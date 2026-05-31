import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { ActivityLog } from '@/components/admin/ActivityLog'
import { AdminActions } from '@/components/admin/AdminActions'

export default async function AdminDashboard() {
  try { await requireAdmin() } catch { redirect('/') }

  const supabase = createClient()
  const [
    { count: usersCount },
    { count: matchesCount },
    { count: predictionsCount },
    { data: activity },
    { data: settings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('matches').select('*', { count: 'exact', head: true }),
    supabase.from('live_predictions').select('*', { count: 'exact', head: true }),
    supabase.from('activity_log').select('*, profiles(username)').order('created_at', { ascending: false }).limit(20),
    supabase.from('settings').select('*'),
  ])

  const registrationEnabled = settings?.find((s) => s.key === 'registration_enabled')?.value !== 'false'
  const deadline = settings?.find((s) => s.key === 'initial_prediction_deadline')?.value || ''

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Panel de Control</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard emoji="👥" label="Usuarios" value={usersCount || 0} />
        <StatCard emoji="⚽" label="Partidos" value={matchesCount || 0} />
        <StatCard emoji="🎯" label="Pronósticos" value={predictionsCount || 0} />
        <StatCard emoji="✅" label="Finalizados" value={0} />
      </div>

      <AdminActions
        registrationEnabled={registrationEnabled}
        initialDeadline={deadline}
      />

      <Card>
        <h2 className="font-semibold text-white mb-4">Actividad Reciente</h2>
        <ActivityLog logs={activity || []} />
      </Card>
    </div>
  )
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <Card>
      <div className="text-2xl mb-1">{emoji}</div>
      <div className="text-2xl font-bold text-gold-400">{value}</div>
      <div className="text-xs text-dark-400">{label}</div>
    </Card>
  )
}
