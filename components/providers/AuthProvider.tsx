'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, loading: true,
  signOut: async () => {},
})

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function fetchProfile(userId: string, accessToken: string): Promise<Profile | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  )
  const data = await res.json()
  return data?.[0] ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('supabase-session')
    if (!stored) {
      setLoading(false)
      return
    }

    try {
      const session = JSON.parse(stored)
      const now = Math.floor(Date.now() / 1000)

      // Verificar que el token no esté vencido
      if (session.expires_at && session.expires_at < now) {
        localStorage.removeItem('supabase-session')
        setLoading(false)
        return
      }

      setUser(session.user)
      fetchProfile(session.user.id, session.access_token).then((p) => {
        setProfile(p)
        setLoading(false)
      })
    } catch {
      localStorage.removeItem('supabase-session')
      setLoading(false)
    }
  }, [])

  const signOut = async () => {
    const stored = localStorage.getItem('supabase-session')
    if (stored) {
      try {
        const session = JSON.parse(stored)
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
      } catch {}
    }
    localStorage.removeItem('supabase-session')
    setUser(null)
    setProfile(null)
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
