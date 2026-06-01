'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { UserManager } from '@/components/admin/UserManager'
import type { Profile } from '@/types'

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([])

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('supabase-session') || '{}')
    const token = session.access_token
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    fetch(`${url}/rest/v1/profiles?select=*&order=created_at.desc`, {
      headers: { apikey: key!, Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then(data => setUsers(data || []))
  }, [])

  return (
    <AdminAuthGuard>
      <div className="flex flex-col gap-6">
        <h1 className="text-xl font-bold text-white">Gestión de Usuarios</h1>
        <UserManager users={users} />
      </div>
    </AdminAuthGuard>
  )
}
