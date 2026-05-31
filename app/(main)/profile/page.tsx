import { getCurrentUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { User, Star, Target, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const supabase = createClient()
  const { data: score } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { data: chainBonuses } = await supabase
    .from('chain_bonus_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const rank = await supabase
    .from('scores')
    .select('user_id', { count: 'exact' })
    .gt('total_points', score?.total_points || 0)

  const myRank = (rank.count || 0) + 1

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
          <User className="w-8 h-8 text-gold-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{user.username}</h1>
          <Badge variant={user.role === 'admin' ? 'gold' : 'gray'}>
            {user.role === 'admin' ? '⭐ Admin' : 'Participante'}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={<Star className="w-4 h-4 text-gold-400" />} label="Puesto" value={`#${myRank}`} />
        <StatCard icon={<Target className="w-4 h-4 text-blue-400" />} label="Puntos totales" value={score?.total_points || 0} />
        <StatCard icon={<Target className="w-4 h-4 text-green-400" />} label="Resultados exactos" value={score?.exact_results || 0} />
        <StatCard icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Bonus cadena" value={score?.chain_bonus_points || 0} />
      </div>

      {/* Links */}
      <Card>
        <h2 className="font-semibold text-white mb-3">Mis pronósticos</h2>
        <div className="flex flex-col gap-2">
          <Link href="/predictions/initial" className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors">
            <span className="text-sm text-white">📋 Pronóstico inicial (Capa 1)</span>
            <span className="text-gold-400 text-sm">Ver →</span>
          </Link>
          <Link href="/predictions/live" className="flex items-center justify-between p-3 bg-dark-800/50 rounded-lg hover:bg-dark-800 transition-colors">
            <span className="text-sm text-white">🎯 Pronósticos en vivo (Capa 2)</span>
            <span className="text-gold-400 text-sm">Ver →</span>
          </Link>
        </div>
      </Card>

      {/* Chain bonus log */}
      {chainBonuses && chainBonuses.length > 0 && (
        <Card>
          <h2 className="font-semibold text-white mb-3">Historial de Bonus de Cadena</h2>
          <div className="flex flex-col gap-2">
            {chainBonuses.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2 border-b border-dark-800/50">
                <span className="text-sm text-dark-300">{b.bonus_type.replace(/_/g, ' ')}</span>
                <span className="text-gold-400 font-semibold">+{b.points_awarded} pts</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-dark-400">{label}</span></div>
      <div className="text-xl font-bold text-white">{value}</div>
    </Card>
  )
}
