'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { ClientAuthGuard } from '@/components/providers/ClientAuthGuard'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { User, Star, Target, Zap } from 'lucide-react'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, profile } = useAuth()
  const [score, setScore] = useState<any>(null)
  const [myRank, setMyRank] = useState<number>(0)
  const [chainBonuses, setChainBonuses] = useState<any[]>([])

  useEffect(() => {
    if (!user) return
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const headers = { apikey: key!, Authorization: `Bearer ${token}` }

    Promise.all([
      fetch(`${url}/rest/v1/scores?select=*&user_id=eq.${user.id}`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/scores?select=total_points&order=total_points.desc`, { headers }).then(r => r.json()),
      fetch(`${url}/rest/v1/chain_bonus_log?select=*&user_id=eq.${user.id}&order=created_at.desc&limit=20`, { headers }).then(r => r.json()),
    ]).then(([s, all, cb]) => {
      setScore(s?.[0] || null)
      const rank = (all || []).findIndex((r: any) => r.total_points <= (s?.[0]?.total_points || 0))
      setMyRank(rank >= 0 ? rank + 1 : all.length)
      setChainBonuses(cb || [])
    })
  }, [user])

  return (
    <ClientAuthGuard>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <User className="w-8 h-8 text-gold-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.username}</h1>
            <Badge variant={profile?.role === 'admin' ? 'gold' : 'gray'}>
              {profile?.role === 'admin' ? '⭐ Admin' : 'Participante'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={<Star className="w-4 h-4 text-gold-400" />} label="Puesto" value={`#${myRank}`} />
          <StatCard icon={<Target className="w-4 h-4 text-blue-400" />} label="Puntos totales" value={score?.total_points || 0} />
          <StatCard icon={<Target className="w-4 h-4 text-green-400" />} label="Exactos" value={score?.exact_results || 0} />
          <StatCard icon={<Zap className="w-4 h-4 text-yellow-400" />} label="Bonus cadena" value={score?.chain_bonus_points || 0} />
        </div>

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

        {chainBonuses.length > 0 && (
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
    </ClientAuthGuard>
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
