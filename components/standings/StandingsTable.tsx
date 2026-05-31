'use client'

import { ArrowUp, ArrowDown, Minus, Star } from 'lucide-react'
import { cn, getRankChange } from '@/lib/utils'
import { useAuth } from '@/components/providers/AuthProvider'
import Link from 'next/link'

interface ScoreRow {
  user_id: string
  base_points: number
  chain_bonus_points: number
  total_points: number
  exact_results: number
  correct_winners: number
  profiles?: { username: string }
  prev_rank?: number | null
}

interface Props {
  standings: ScoreRow[]
  compact?: boolean
}

export function StandingsTable({ standings, compact }: Props) {
  const { profile } = useAuth()

  if (standings.length === 0) {
    return <p className="text-dark-400 text-sm py-4 text-center">Aún no hay puntos registrados.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-dark-400 text-xs uppercase tracking-wide">
            <th className="text-left pb-3 pl-2">#</th>
            <th className="text-left pb-3">Usuario</th>
            <th className="text-right pb-3">Pts</th>
            {!compact && (
              <>
                <th className="text-right pb-3">Exactos</th>
                <th className="text-right pb-3">Ganadores</th>
                <th className="text-right pb-3">Cadena</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, i) => {
            const rank = i + 1
            const isMe = profile?.id === row.user_id
            const change = getRankChange(rank, row.prev_rank ?? null)

            return (
              <tr
                key={row.user_id}
                className={cn(
                  'border-b border-dark-800/50 transition-colors',
                  isMe ? 'bg-gold-500/5' : 'hover:bg-dark-800/30'
                )}
              >
                <td className="py-2.5 pl-2">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'font-bold w-5 text-center',
                      rank === 1 ? 'text-gold-400' : rank <= 3 ? 'text-dark-200' : 'text-dark-400'
                    )}>
                      {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                    </span>
                    {change === 'up' && <ArrowUp className="w-3 h-3 text-green-400" />}
                    {change === 'down' && <ArrowDown className="w-3 h-3 text-red-400" />}
                    {change === 'same' && <Minus className="w-3 h-3 text-dark-600" />}
                  </div>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    {isMe && <Star className="w-3 h-3 text-gold-400 shrink-0" />}
                    <span className={cn('font-medium', isMe ? 'text-gold-300' : 'text-white')}>
                      {row.profiles?.username || '—'}
                    </span>
                  </div>
                </td>
                <td className="py-2.5 text-right">
                  <span className={cn('font-bold', isMe ? 'text-gold-400' : 'text-white')}>
                    {row.total_points}
                  </span>
                </td>
                {!compact && (
                  <>
                    <td className="py-2.5 text-right text-dark-300">{row.exact_results}</td>
                    <td className="py-2.5 text-right text-dark-300">{row.correct_winners}</td>
                    <td className="py-2.5 text-right">
                      <span className="text-gold-500 font-medium">{row.chain_bonus_points}</span>
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      {compact && (
        <div className="mt-3 text-center">
          <Link href="/standings" className="text-gold-400 text-sm hover:text-gold-300 transition-colors">
            Ver tabla completa →
          </Link>
        </div>
      )}
    </div>
  )
}
