'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Search, CheckCircle, XCircle, Eye, ShieldCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOCK_COINS } from '@/lib/mock-data'

type FilterStatus = '' | 'AVAILABLE' | 'PENDING_REVIEW' | 'DELISTED' | 'DRAFT'

export default function AdminCoinsPage() {
  const [coins, setCoins]         = useState(MOCK_COINS)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatus] = useState<FilterStatus>('')
  const [actionId, setActionId]   = useState<string | null>(null)

  const filtered = coins.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      c.title_th.toLowerCase().includes(q) ||
      c.monk_name_th.toLowerCase().includes(q) ||
      c.temple_th.toLowerCase().includes(q)
    const matchStatus = !statusFilter || c.status === statusFilter.toLowerCase().replace('_', '_')
    return matchSearch && matchStatus
  })

  const updateCoin = async (id: string, status: string) => {
    setActionId(id)
    try {
      await fetch(`/api/admin/coins/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    } catch { /* mock */ }
    setCoins(prev => prev.map(c => c.id === id ? { ...c, status: status as 'available' | 'reserved' | 'sold' } : c))
    setActionId(null)
  }

  const STATUS_COUNT = {
    all:     coins.length,
    pending: coins.filter(c => c.status === 'available' && !c.is_authenticated).length,
    active:  coins.filter(c => c.status === 'available').length,
    sold:    coins.filter(c => c.status === 'sold').length,
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">จัดการเหรียญ</h1>
          <p className="text-gray-500 text-sm">{coins.length} เหรียญทั้งหมด</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { label: `ทั้งหมด (${STATUS_COUNT.all})`,            value: '' },
          { label: `รอรับรอง (${STATUS_COUNT.pending})`,       value: 'PENDING_REVIEW' },
          { label: `ในตลาด (${STATUS_COUNT.active})`,          value: 'AVAILABLE' },
          { label: `ขายแล้ว (${STATUS_COUNT.sold})`,           value: 'SOLD' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatus(tab.value as FilterStatus)}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-semibold transition-all',
              statusFilter === tab.value
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-transparent'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหาเหรียญ, เกจิ, วัด..."
          className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-500"
        />
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(coin => (
          <div key={coin.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition-colors">
            {/* Image */}
            <div className="relative aspect-square bg-gray-800">
              {coin.images?.[0] && (
                <Image
                  src={coin.images[0]}
                  alt={coin.title_th}
                  fill
                  className="object-cover"
                  sizes="200px"
                />
              )}
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {coin.is_authenticated && (
                  <span className="bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={9} /> รับรองแล้ว
                  </span>
                )}
                {!coin.is_authenticated && (
                  <span className="bg-yellow-500/90 text-[#1A1208] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={9} /> รอรับรอง
                  </span>
                )}
              </div>
              <div className={cn(
                'absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full',
                coin.status === 'available' ? 'bg-green-500/80 text-white' :
                coin.status === 'reserved'  ? 'bg-blue-500/80 text-white' :
                'bg-gray-600/80 text-gray-200'
              )}>
                {coin.status === 'available' ? 'มีของ' : coin.status === 'reserved' ? 'จอง' : 'ขายแล้ว'}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-bold text-white text-sm line-clamp-2 mb-1">{coin.title_th}</p>
              <p className="text-xs text-gray-500 mb-2">{coin.temple_th} · ปี {coin.year_th}</p>
              <p className="text-[#C9A84C] font-black text-sm mb-3">฿{coin.price_thb.toLocaleString()}</p>

              {/* Actions */}
              <div className="flex gap-2">
                <Link href={`/coins/${coin.id}`} target="_blank">
                  <button className="p-2 bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors" title="ดูหน้าเหรียญ">
                    <Eye size={14} />
                  </button>
                </Link>
                {coin.status !== 'available' && (
                  <button
                    onClick={() => updateCoin(coin.id, 'AVAILABLE')}
                    disabled={actionId === coin.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-xs font-bold hover:bg-green-600/30 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={12} /> อนุมัติ
                  </button>
                )}
                {coin.status === 'available' && (
                  <button
                    onClick={() => updateCoin(coin.id, 'DELISTED')}
                    disabled={actionId === coin.id}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs font-bold hover:bg-red-600/30 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={12} /> ถอด
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-600">ไม่พบเหรียญ</div>
      )}
    </div>
  )
}
