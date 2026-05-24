'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default function ProtectedRoute({
  children,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(`${redirectTo}?redirect=${window.location.pathname}`)
    }
  }, [user, loading, router, redirectTo])

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8EE] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🪙</div>
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  // ยังไม่ login → ไม่แสดง content (middleware จะ redirect)
  if (!user) return null

  return <>{children}</>
}
