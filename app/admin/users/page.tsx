'use client'

import { useEffect, useState } from 'react'
import { AdminAuthGuard } from '@/components/providers/AdminAuthGuard'
import { useAuth } from '@/components/providers/AuthProvider'
import { UserManager } from '@/components/admin/UserManager'
import { sbFetch } from '@/lib/supabase/fetch'
import type { Profile } from '@/types'

function UsersContent() {
  const { loading: authLoading, user } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])

  useEffect(() => {
    if (authLoading || !user) return
    sbFetch('profiles', 'select=*&order=created_at.desc').then(data => setUsers(data || []))
  }, [authLoading, user])

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Gestión de Usuarios</h1>
      <UserManager users={users} />
    </div>
  )
}

export default function UsersPage() {
  return (
    <AdminAuthGuard>
      <UsersContent />
    </AdminAuthGuard>
  )
}
