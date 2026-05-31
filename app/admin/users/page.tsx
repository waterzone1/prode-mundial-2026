import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserManager } from '@/components/admin/UserManager'

export default async function UsersPage() {
  try { await requireAdmin() } catch { redirect('/') }

  const supabase = createClient()
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold text-white">Gestión de Usuarios</h1>
      <UserManager users={users || []} />
    </div>
  )
}
