'use client'
import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X, ShieldCheck, ChevronDown } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import CoinCard from '@/components/coins/CoinCard'
import { Button } from '@/components/ui/Button'
import { MOCK_COINS } from '@/lib/mock-data'

const MATERIALS_TH = ['ทั้งหมด', 'เนื้อทองแดง', 'เนื้อเงิน', 'เนื้ออัลปาก้า', 'เนื้อทองเหลือง']
const MONKS = ['ทั้งหมด', 'หลวงปู่ทวด', 'หลวงพ่อเงิน', 'หลวงพ่อคูณ', 'สมเด็จโต', 'หลวงปู่ศุข', 'หลวงพ่อโสธร']

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'popular'

export default function MarketPage() {
  const { t, lang } = useLang()
  const [search, setSearch] = useState('')
  const [authOnly, setAuthOnly] = useState(false)
  const [selectedMonk, setSelectedMonk] = useState('ทั้งหมด')
  const [selectedMaterial, setSelectedMaterial] = useState('ทั้งหมด')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [filterOpen, setFilterOpen] = useState(false)
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let coins = [...MOCK_COINS]
    if (search) {
      const q = search.toLowerCase()
      coins = coins.filter(c =>
        c.title_th.toLowerCase().includes(q) ||
        c.title_en.toLowerCase().includes(q) ||
        c.monk_name_th.toLowerCase().includes(q) ||
        c.monk_name_en.toLowerCase().includes(q) ||
        c.temple_th.toLowerCase().includes(q)
      )
    }
    if (authOnly) coins = coins.filter(c => c.is_authenticated)
    if (selectedMonk !== 'ทั้งหมด') coins = coins.filter(c => c.monk_name_th === selectedMonk)
    if (selectedMaterial !== 'ทั้งหมด') coins = coins.filter(c => c.material_th.includes(selectedMaterial.replace('เนื้อ', '')))
    if (priceMin) coins = coins.filter(c => c.price_thb >= Number(priceMin))
    if (priceMax) coins = coins.filter(c => c.price_thb <= Number(priceMax))

    switch (sort) {
      case 'price_asc':  return coins.sort((a, b) => a.price_thb - b.price_thb)
      case 'price_desc': return coins.sort((a, b) => b.price_thb - a.price_thb)
      case 'popular':    return coins.sort((a, b) => b.view_count - a.view_count)
      default:           return coins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }
  }, [search, authOnly, selectedMonk, selectedMaterial, priceMin, priceMax, sort])

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clearFilters = () => {
    setSearch(''); setAuthOnly(false); setSelectedMonk('ทั้งหมด')
    setSelectedMaterial('ทั้งหมด'); setPriceMin(''); setPriceMax('')
  }

  const hasFilters = authOnly || selectedMonk !== 'ทั้งหมด' || selectedMaterial !== 'ทั้งหมด' || priceMin || priceMax

  const sortLabels: Record<SortKey, string> = {
    newest:     t.coin.sort_newest,
    price_asc:  t.coin.sort_price_asc,
    price_desc: t.coin.sort_price_desc,
    popular:    t.coin.sort_popular,
  }

  return (
    <div className="min-h-screen bg-[#FDF8EE]">
      {/* Page Header */}
      <div className="dark-gradient text-white py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-[#F0D080] mb-1">{t.nav.market}</h1>
          <p className="text-yellow-200/60 text-sm">เหรียญพระเครื่องไทยแท้ รับรองโดยผู้เชี่ยวชาญ</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search + Controls bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t.home.search_placeholder}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter toggle (mobile) */}
          <Button
            variant={filterOpen ? 'gold' : 'outline'}
            size="md"
            onClick={() => setFilterOpen(!filterOpen)}
            className="sm:hidden"
          >
            <SlidersHorizontal size={16} />
            ตัวกรอง
            {hasFilters && <span className="bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">!</span>}
          </Button>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 cursor-pointer"
            >
              {(Object.keys(sortLabels) as SortKey[]).map(k => (
                <option key={k} value={k}>{sortLabels[k]}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar Filter (desktop) ── */}
          <aside className={`${filterOpen ? 'block' : 'hidden'} sm:block w-full sm:w-56 lg:w-64 shrink-0`}>
            <div className="bg-white rounded-2xl border border-yellow-100 p-5 sticky top-20 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-gray-800">ตัวกรอง</h3>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                    <X size={12} /> ล้างทั้งหมด
                  </button>
                )}
              </div>

              {/* Authenticated only */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer group">
                  <div
                    onClick={() => setAuthOnly(!authOnly)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${authOnly ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-green-400'}`}
                  >
                    {authOnly && <ShieldCheck size={12} className="text-white" />}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{t.coin.filter_auth}</span>
                </label>
              </div>

              {/* Monk filter */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">เกจิอาจารย์</h4>
                <div className="space-y-1">
                  {MONKS.map(monk => (
                    <button
                      key={monk}
                      onClick={() => setSelectedMonk(monk)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${selectedMonk === monk ? 'bg-yellow-100 text-yellow-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {monk}
                    </button>
                  ))}
                </div>
              </div>

              {/* Material filter */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">เนื้อเหรียญ</h4>
                <div className="space-y-1">
                  {MATERIALS_TH.map(mat => (
                    <button
                      key={mat}
                      onClick={() => setSelectedMaterial(mat)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-all ${selectedMaterial === mat ? 'bg-yellow-100 text-yellow-800 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      {mat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">ช่วงราคา (บาท)</h4>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="ต่ำสุด"
                    value={priceMin}
                    onChange={e => setPriceMin(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                  <input
                    type="number"
                    placeholder="สูงสุด"
                    value={priceMax}
                    onChange={e => setPriceMax(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* ── Coin Grid ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500">
                แสดง <span className="font-bold text-gray-800">{filtered.length}</span> รายการ
              </p>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-4">🔍</div>
                <p className="font-medium">ไม่พบเหรียญที่ตรงกับเงื่อนไข</p>
                <button onClick={clearFilters} className="mt-3 text-sm text-yellow-700 hover:underline">ล้างตัวกรอง</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(coin => (
                  <CoinCard
                    key={coin.id}
                    coin={coin}
                    onWatchlist={toggleWatchlist}
                    isWatchlisted={watchlist.has(coin.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
