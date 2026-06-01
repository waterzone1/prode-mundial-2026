'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { User, Session } from '@supabase/supabase-js'
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

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabase()

    const loadProfile = async (u: User) => {
      const { data } = await supabase.from('profiles').select('*').eq('id', u.id).single()
      setProfile(data)
    }

    // Primero intentar restaurar sesión desde localStorage
    const stored = localStorage.getItem('supabase-session')
    if (stored) {
      try {
        const session: Session = JSON.parse(stored)
        supabase.auth.setSession(session).then(async ({ data }) => {
          if (data.session?.user) {
            setUser(data.session.user)
            await loadProfile(data.session.user)
          } else {
            localStorage.removeItem('supabase-session')
          }
          setLoading(false)
        })
      } catch {
        localStorage.removeItem('supabase-session')
        setLoading(false)
      }
    } else {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          setUser(session.user)
          await loadProfile(session.user)
        }
        setLoading(false)
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await loadProfile(session.user)
        localStorage.setItem('supabase-session', JSON.stringify(session))
      } else {
        setProfile(null)
        localStorage.removeItem('supabase-session')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getSupabase()
    localStorage.removeItem('supabase-session')
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
