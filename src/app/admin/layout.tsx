'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import {
  LayoutDashboard, Users, Coins, ShoppingBag,
  AlertTriangle, TrendingUp, LogOut, Menu, X,
  Shield, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin',          label: 'ภาพรวม',       icon: <LayoutDashboard size={18} />, exact: true },
  { href: '/admin/users',    label: 'จัดการผู้ใช้',  icon: <Users size={18} /> },
  { href: '/admin/coins',    label: 'อนุมัติเหรียญ', icon: <Coins size={18} /> },
  { href: '/admin/orders',   label: 'คำสั่งซื้อ',    icon: <ShoppingBag size={18} /> },
  { href: '/admin/fraud',    label: 'Fraud Alerts',  icon: <AlertTriangle size={18} /> },
  { href: '/admin/revenue',  label: 'รายได้',        icon: <TrendingUp size={18} /> },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth()
  const router   = useRouter()
  const pathname = usePathname()
  const [sideOpen, setSideOpen] = useState(false)

  useEffect(() => {
    if (!loading && (!user || (user.user_metadata?.role !== 'ADMIN' && !user.email?.includes('admin')))) {
      // ถ้าไม่ใช่ admin → redirect (ใน production ตรวจจาก Prisma role)
      // ตอนนี้ allow ผ่านสำหรับ demo
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-bounce">🛡️</div>
          <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 text-sm mt-3">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* ── Sidebar ──────────────────────────────────── */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-60 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-300',
        'lg:translate-x-0',
        sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
            <Shield size={16} className="text-[#1A1208]" />
          </div>
          <div>
            <div className="text-white font-black text-sm">SIAM COIN</div>
            <div className="text-yellow-500 text-xs font-semibold">Admin Panel</div>
          </div>
          <button
            onClick={() => setSideOpen(false)}
            className="ml-auto lg:hidden text-gray-500 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSideOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive(item.href, item.exact)
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              {item.icon}
              {item.label}
              {isActive(item.href, item.exact) && (
                <ChevronRight size={14} className="ml-auto" />
              )}
            </Link>
          ))}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <Coins size={16} />
            กลับหน้าเว็บ
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-900/20 transition-all"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* ── Main content ──────────────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-gray-900/80 backdrop-blur-md border-b border-gray-800 px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => setSideOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white p-1"
          >
            <Menu size={20} />
          </button>
          <div className="text-gray-400 text-sm">
            {NAV_ITEMS.find(n => isActive(n.href, n.exact))?.label ?? 'Admin'}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="text-xs text-gray-500 hidden sm:block">{user?.email}</div>
            <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-xs font-black text-[#1A1208]">
              {user?.email?.[0]?.toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
