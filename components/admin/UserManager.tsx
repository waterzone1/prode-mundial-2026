'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/providers/ToastProvider'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types'
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react'

interface Props { users: Profile[] }

export function UserManager({ users: initial }: Props) {
  const { toast } = useToast()
  const [users, setUsers] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  const changeRole = async (userId: string, role: 'admin' | 'user') => {
    setLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role } : u))
      toast('Rol actualizado', 'success')
    } catch {
      toast('Error al cambiar rol', 'error')
    } finally {
      setLoading(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Eliminar este usuario y todos sus datos? Esta acción es irreversible.')) return
    setLoading(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      if (!res.ok) throw new Error()
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      toast('Usuario eliminado', 'success')
    } catch {
      toast('Error al eliminar usuario', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-700/50 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-dark-800/50">
          <tr className="text-dark-400 text-xs uppercase tracking-wide">
            <th className="text-left p-3">Usuario</th>
            <th className="text-left p-3 hidden sm:table-cell">Registro</th>
            <th className="text-left p-3">Rol</th>
            <th className="text-right p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-t border-dark-800/50 hover:bg-dark-800/20 transition-colors">
              <td className="p-3 font-medium text-white">{user.username}</td>
              <td className="p-3 text-dark-400 hidden sm:table-cell">{formatDate(user.created_at)}</td>
              <td className="p-3">
                <Badge variant={user.role === 'admin' ? 'gold' : 'gray'}>
                  {user.role}
                </Badge>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2 justify-end">
                  {user.role === 'user' ? (
                    <Button
                      size="sm" variant="outline"
                      loading={loading === user.id}
                      onClick={() => changeRole(user.id, 'admin')}
                    >
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin
                    </Button>
                  ) : (
                    <Button
                      size="sm" variant="ghost"
                      loading={loading === user.id}
                      onClick={() => changeRole(user.id, 'user')}
                    >
                      <ShieldOff className="w-3.5 h-3.5" /> Quitar admin
                    </Button>
                  )}
                  <Button
                    size="sm" variant="danger"
                    loading={loading === user.id}
                    onClick={() => deleteUser(user.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
