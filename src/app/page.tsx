'use client'
import Link from 'next/link'
import { Search, ShieldCheck, CreditCard, Globe, Languages, TrendingUp, Star, ChevronRight } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import CoinCard from '@/components/coins/CoinCard'
import { MOCK_COINS } from '@/lib/mock-data'
import { useState } from 'react'

const STATS = [
  { value: '10,000+', label_th: 'เหรียญในระบบ',   label_en: 'Coins Listed',      label_zh: '钱币上架' },
  { value: '500+',    label_th: 'เซียนพระรับรอง',  label_en: 'Verified Experts',  label_zh: '认证专家' },
  { value: '20+',     label_th: 'ประเทศที่ส่งถึง', label_en: 'Countries Shipped', label_zh: '配送国家' },
  { value: '฿40M+',   label_th: 'มูลค่าซื้อขาย',  label_en: 'Total Traded',      label_zh: '总交易额' },
]

const TRUST_ITEMS = [
  {
    icon: <ShieldCheck className="text-green-500" size={28} />,
    key: 'trust_auth',
    key_desc: 'trust_auth_desc',
  },
  {
    icon: <CreditCard className="text-blue-500" size={28} />,
    key: 'trust_pay',
    key_desc: 'trust_pay_desc',
  },
  {
    icon: <Globe className="text-purple-500" size={28} />,
    key: 'trust_ship',
    key_desc: 'trust_ship_desc',
  },
  {
    icon: <Languages className="text-yellow-600" size={28} />,
    key: 'trust_lang',
    key_desc: 'trust_lang_desc',
  },
]

const FEATURED_MONKS = [
  { name_th: 'หลวงปู่ทวด',      name_en: 'LP Thuat',    emoji: '🙏', count: 142 },
  { name_th: 'หลวงพ่อเงิน',     name_en: 'LP Ngern',    emoji: '🪙', count: 87  },
  { name_th: 'หลวงพ่อคูณ',      name_en: 'LP Khun',     emoji: '⭐', count: 201 },
  { name_th: 'สมเด็จโต',        name_en: 'Somdej Toh',  emoji: '📿', count: 65  },
  { name_th: 'หลวงปู่ศุข',      name_en: 'LP Suk',      emoji: '✨', count: 43  },
  { name_th: 'หลวงพ่อโสธร',     name_en: 'LP Sothon',   emoji: '🏛️', count: 119 },
]

export default function HomePage() {
  const { t, lang } = useLang()
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const popularCoins = MOCK_COINS.slice(0, 4)

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <div>
      {/* ═══════════════════════════════════════════════ HERO */}
      <section className="dark-gradient text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-yellow-600/10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-yellow-800/10 blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-yellow-900/40 border border-yellow-700/50 text-yellow-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
              <TrendingUp size={13} />
              <span>ตลาดมูลค่ากว่า 40,000 ล้านบาท/ปี</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight">
              <span className="text-[#F0D080]">SIAM</span> COIN
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-yellow-200 mb-2">
              {t.home.hero_title}
            </p>
            <p className="text-yellow-200/60 text-base sm:text-lg mb-10">
              {t.home.hero_sub}
            </p>

            {/* Search bar */}
            <div className="relative max-w-xl mx-auto mb-8">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t.home.search_placeholder}
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-white text-gray-800 text-sm shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
              <Link href={`/market?q=${search}`}>
                <button className="absolute right-2 top-1/2 -translate-y-1/2 gold-gradient text-[#1A1208] font-bold text-sm px-4 py-2 rounded-xl">
                  ค้นหา
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <Link href="/market">
                <Button variant="gold" size="lg">
                  {t.home.hero_cta}
                  <ChevronRight size={18} />
                </Button>
              </Link>
              <Link href="/sell">
                <Button variant="outline" size="lg" className="border-yellow-500 text-yellow-300 hover:bg-yellow-900/20">
                  ลงขายเหรียญ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ STATS */}
      <section className="bg-[#C9A84C] text-[#1A1208]">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {STATS.map((s, i) => (
            <div key={i} className="py-2">
              <div className="text-2xl sm:text-3xl font-black">{s.value}</div>
              <div className="text-sm font-medium opacity-80">
                {lang === 'en' ? s.label_en : lang === 'zh' ? s.label_zh : s.label_th}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ POPULAR COINS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">{t.home.popular}</h2>
            <p className="text-gray-500 text-sm mt-1">เหรียญที่นักสะสมให้ความสนใจมากที่สุด</p>
          </div>
          <Link href="/market" className="text-[#C9A84C] hover:text-[#8B6914] font-semibold text-sm flex items-center gap-1">
            ดูทั้งหมด <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {popularCoins.map(coin => (
            <CoinCard
              key={coin.id}
              coin={coin}
              onWatchlist={toggleWatchlist}
              isWatchlisted={watchlist.has(coin.id)}
            />
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ MONK CATEGORIES */}
      <section className="bg-white py-16 border-t border-yellow-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">เกจิอาจารย์ชื่อดัง</h2>
          <p className="text-gray-500 text-sm mb-8">Popular Monks | 著名高僧</p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {FEATURED_MONKS.map((monk, i) => (
              <Link
                key={i}
                href={`/market?monk=${encodeURIComponent(monk.name_en)}`}
                className="group bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-4 text-center hover:border-yellow-400 hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-2">{monk.emoji}</div>
                <div className="font-bold text-gray-900 text-sm group-hover:text-[#8B6914]">
                  {lang === 'en' ? monk.name_en : monk.name_th}
                </div>
                <div className="text-xs text-gray-400 mt-1">{monk.count} เหรียญ</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ WHY US */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">{t.home.why_us}</h2>
          <p className="text-gray-500">ความเชื่อมั่นที่สร้างจากประสบการณ์จริง</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {TRUST_ITEMS.map((item, i) => {
            const key = item.key as keyof typeof t.home
            const descKey = item.key_desc as keyof typeof t.home
            return (
              <div key={i} className="text-center p-6 bg-white rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <h3 className="font-black text-gray-900 mb-2">{t.home[key] as string}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{t.home[descKey] as string}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ TESTIMONIALS */}
      <section className="bg-[#1A1208] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-black text-[#F0D080] text-center mb-10">
            เสียงจากลูกค้าของเรา
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Wei Zhang',
                country: '🇸🇬 Singapore',
                text: 'The coin arrived in perfect condition. Certificate was very professional. Will definitely buy again!',
                rating: 5,
              },
              {
                name: 'นายธนพล ก.',
                country: '🇹🇭 Thailand',
                text: 'ระบบใช้งานง่าย ของแท้ทุกชิ้น เซียนพระรับรองชัดเจน ไว้ใจได้มากครับ',
                rating: 5,
              },
              {
                name: 'Li Mei Chen',
                country: '🇨🇳 China',
                text: '非常满意！钱币是真品，包装精美，物流快速。下次还会购买。',
                rating: 5,
              },
            ].map((r, i) => (
              <div key={i} className="bg-white/5 border border-yellow-900/30 rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array(r.rating).fill(0).map((_, j) => (
                    <Star key={j} size={14} className="fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-yellow-100/80 text-sm leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-yellow-800 flex items-center justify-center text-xs font-bold text-yellow-200">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="text-[#F0D080] text-sm font-bold">{r.name}</div>
                    <div className="text-yellow-600 text-xs">{r.country}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════ CTA */}
      <section className="py-16 bg-gradient-to-r from-yellow-50 to-amber-50 border-t border-yellow-200">
        <div className="max-w-2xl mx-auto text-center px-4">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-3">
            คุณมีเหรียญดีๆ อยากขายไหม?
          </h2>
          <p className="text-gray-500 mb-8">
            เข้าร่วมเป็นผู้ขายกับเรา เข้าถึงผู้ซื้อจากกว่า 20 ประเทศ
          </p>
          <Link href="/sell">
            <Button variant="dark" size="lg">
              เริ่มขายเหรียญวันนี้
              <ChevronRight size={18} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
