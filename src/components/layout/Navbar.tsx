'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLang } from '@/context/LangContext'
import { useAuth } from '@/context/AuthContext'
import { Lang } from '@/lib/i18n'
import {
  Menu, X, Globe, ShoppingBag, LayoutDashboard,
  LogIn, Store, LogOut, User, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

const FLAG: Record<Lang, string> = { th: '🇹🇭', en: '🇬🇧', zh: '🇨🇳' }
const LANGS: Lang[] = ['th', 'en', 'zh']

export default function Navbar() {
  const { lang, setLang, t } = useLang()
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  const navLinks = [
    { href: '/',          label: t.nav.home,      icon: <Store size={16} /> },
    { href: '/market',    label: t.nav.market,     icon: <ShoppingBag size={16} /> },
    { href: '/sell',      label: t.nav.sell,       icon: null },
    { href: '/dashboard', label: t.nav.dashboard,  icon: <LayoutDashboard size={16} /> },
  ]

  const handleSignOut = async () => {
    await signOut()
    setUserOpen(false)
    router.push('/')
    router.refresh()
  }

  // ชื่อย่อสำหรับ Avatar
  const userInitial = user?.user_metadata?.name?.[0]?.toUpperCase()
    || user?.email?.[0]?.toUpperCase()
    || '?'

  return (
    <nav className="sticky top-0 z-50 bg-[#1A1208] shadow-lg border-b border-yellow-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl">🪙</span>
            <div>
              <span className="text-[#F0D080] font-black text-lg tracking-wide group-hover:text-yellow-300 transition-colors">
                SIAM COIN
              </span>
              <div className="text-yellow-600 text-[10px] leading-none hidden sm:block">
                ตลาดเหรียญพระเครื่อง
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-1.5 text-yellow-200/80 hover:text-[#F0D080] px-3 py-2 rounded-lg hover:bg-white/5 text-sm font-medium transition-all"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => { setLangOpen(!langOpen); setUserOpen(false) }}
                className="flex items-center gap-1.5 text-yellow-200/80 hover:text-[#F0D080] px-3 py-2 rounded-lg hover:bg-white/5 text-sm transition-all"
              >
                <Globe size={15} />
                <span>{FLAG[lang]}</span>
                <span className="uppercase hidden sm:inline">{lang}</span>
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-1 bg-[#2D2010] border border-yellow-900/50 rounded-xl shadow-xl overflow-hidden z-50 min-w-[120px]">
                  {LANGS.map(l => (
                    <button
                      key={l}
                      onClick={() => { setLang(l); setLangOpen(false) }}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-yellow-900/30 transition-colors ${
                        lang === l ? 'text-[#F0D080] font-bold' : 'text-yellow-200/70'
                      }`}
                    >
                      {FLAG[l]}
                      <span className="uppercase">{l}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User area */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-yellow-900/40 animate-pulse" />
            ) : user ? (
              // ── Logged in: แสดง Avatar + Dropdown ──
              <div className="relative">
                <button
                  onClick={() => { setUserOpen(!userOpen); setLangOpen(false) }}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-xs font-black text-[#1A1208]">
                    {userInitial}
                  </div>
                  <span className="text-yellow-200/80 text-sm hidden sm:block max-w-[100px] truncate">
                    {user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown size={14} className="text-yellow-600" />
                </button>

                {userOpen && (
                  <div className="absolute right-0 mt-1 bg-[#2D2010] border border-yellow-900/50 rounded-xl shadow-xl overflow-hidden z-50 min-w-[180px]">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-yellow-900/30">
                      <div className="text-[#F0D080] font-bold text-sm truncate">
                        {user.user_metadata?.name || 'ผู้ใช้งาน'}
                      </div>
                      <div className="text-yellow-200/50 text-xs truncate">{user.email}</div>
                    </div>
                    {[
                      { href: '/dashboard', icon: <LayoutDashboard size={14} />, label: t.nav.dashboard },
                      { href: '/sell',      icon: <ShoppingBag size={14} />,     label: t.nav.sell },
                      { href: '/profile',   icon: <User size={14} />,            label: t.nav.profile },
                    ].map(item => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-yellow-200/70 hover:bg-yellow-900/30 hover:text-[#F0D080] transition-colors"
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    ))}
                    <div className="border-t border-yellow-900/30">
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                      >
                        <LogOut size={14} />
                        {t.nav.logout}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // ── Not logged in: แสดงปุ่ม Login ──
              <Link href="/login" className="hidden md:block">
                <Button variant="gold" size="sm">
                  <LogIn size={14} />
                  {t.nav.login}
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-yellow-200 p-1.5 rounded-lg hover:bg-white/10"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 border-t border-yellow-900/30 mt-2 pt-2 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 text-yellow-200/80 hover:text-[#F0D080] px-3 py-2.5 rounded-lg hover:bg-white/5 text-sm font-medium"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <div className="pt-2 px-3">
              {user ? (
                <div className="space-y-2">
                  <div className="text-yellow-200/60 text-xs px-1">
                    Login: {user.email}
                  </div>
                  <Button variant="danger" size="sm" className="w-full" onClick={handleSignOut}>
                    <LogOut size={14} />
                    {t.nav.logout}
                  </Button>
                </div>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)}>
                  <Button variant="gold" size="sm" className="w-full">
                    <LogIn size={14} />
                    {t.nav.login}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdowns */}
      {(langOpen || userOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setLangOpen(false); setUserOpen(false) }}
        />
      )}
    </nav>
  )
}
