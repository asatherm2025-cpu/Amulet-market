'use client'
import Link from 'next/link'
import { useLang } from '@/context/LangContext'
import { Share2, Camera, Play, MessageCircle } from 'lucide-react'

export default function Footer() {
  const { t } = useLang()
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[#1A1208] text-yellow-200/70 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🪙</span>
              <span className="text-[#F0D080] font-black text-xl">SIAM COIN</span>
            </div>
            <p className="text-sm leading-relaxed mb-4 text-yellow-200/60 max-w-xs">
              ตลาดเหรียญพระเครื่องไทยออนไลน์ที่เชื่อถือได้
              รับรองของแท้โดยเซียนพระผู้เชี่ยวชาญ
              ส่งทั่วโลก
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Share2 size={18} />, href: '#' },
                { icon: <Camera size={18} />, href: '#' },
                { icon: <Play size={18} />, href: '#' },
                { icon: <MessageCircle size={18} />, href: '#' },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="p-2 rounded-lg bg-white/5 hover:bg-yellow-900/40 text-yellow-200/60 hover:text-[#F0D080] transition-all"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-[#F0D080] font-bold mb-3 text-sm uppercase tracking-wider">Market</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/market', label: t.nav.market },
                { href: '/market?filter=authenticated', label: 'เหรียญรับรองแท้' },
                { href: '/market?sort=popular', label: 'เหรียญยอดนิยม' },
                { href: '/sell', label: t.nav.sell },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[#F0D080] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[#F0D080] font-bold mb-3 text-sm uppercase tracking-wider">Info</h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/about', label: t.footer.about },
                { href: '/contact', label: t.footer.contact },
                { href: '/terms', label: t.footer.terms },
                { href: '/privacy', label: t.footer.privacy },
              ].map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-[#F0D080] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-yellow-900/30 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-yellow-200/40">
          <span>© {year} SIAM COIN. {t.footer.rights}.</span>
          <div className="flex gap-4">
            <span>🔒 Secure Payment</span>
            <span>🌏 Worldwide Shipping</span>
            <span>✅ Certified Authentic</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
