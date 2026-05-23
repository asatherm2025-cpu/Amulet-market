'use client'
import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const clientRef = useRef<ReturnType<typeof import('@/lib/supabase/client').createClient> | null>(null)

  useEffect(() => {
    // lazy import เพื่อไม่ให้ run ตอน SSR/build
    import('@/lib/supabase/client').then(({ createClient }) => {
      const supabase = createClient()
      clientRef.current = supabase

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
      // ถ้ายังไม่ config จริง → set loading = false แล้วจบ
      if (!url || url.includes('placeholder')) {
        setLoading(false)
        return
      }

      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    })
  }, [])

  const signOut = async () => {
    if (clientRef.current) {
      await clientRef.current.auth.signOut()
    }
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
