import { formatRelative } from '@/lib/utils'
import type { ActivityLog as Log } from '@/types'

interface Props {
  logs: (Log & { profiles?: { username: string } | null })[]
}

export function ActivityLog({ logs }: Props) {
  if (!logs.length) {
    return <p className="text-dark-500 text-sm">No hay actividad reciente.</p>
  }
  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 py-2 border-b border-dark-800/50">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-500/50 mt-2 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white">
              {log.profiles?.username && (
                <span className="text-gold-400">{log.profiles.username} </span>
              )}
              {log.action.replace(/_/g, ' ')}
              {log.details && <span className="text-dark-400"> — {log.details}</span>}
            </p>
            <p className="text-xs text-dark-500 mt-0.5">{formatRelative(log.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
