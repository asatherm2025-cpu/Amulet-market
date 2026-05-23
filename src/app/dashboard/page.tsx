'use client'
import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck, TrendingUp, Package, Star,
  Plus, Eye, Edit2, Trash2, Truck, CheckCircle,
  Clock, BarChart2, DollarSign
} from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { MOCK_COINS, MOCK_ORDERS, MOCK_SELLER } from '@/lib/mock-data'

type Tab = 'overview' | 'coins' | 'orders'

export default function DashboardPage() {
  const { t } = useLang()
  const [tab, setTab] = useState<Tab>('overview')
  const [coins, setCoins] = useState(MOCK_COINS.slice(0, 5))

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'ภาพรวม',    icon: <BarChart2 size={16} /> },
    { id: 'coins',    label: t.seller.my_coins, icon: <Package size={16} /> },
    { id: 'orders',   label: t.seller.pending_orders, icon: <Truck size={16} /> },
  ]

  const MONTHLY_REVENUE = MOCK_COINS.slice(0, 5).reduce((s, c) => s + (c.status === 'sold' ? c.price_thb : 0), 0) || 48750
  const STAT_CARDS = [
    { icon: <DollarSign size={22} className="text-yellow-600" />, label: t.seller.monthly_revenue, value: `฿${MONTHLY_REVENUE.toLocaleString()}`,  bg: 'bg-yellow-50',  border: 'border-yellow-200' },
    { icon: <Package size={22} className="text-blue-600" />,      label: t.seller.total_sales,     value: MOCK_SELLER.total_sales,                  bg: 'bg-blue-50',    border: 'border-blue-200'   },
    { icon: <Star size={22} className="text-green-600" />,        label: t.seller.rating,          value: `${MOCK_SELLER.rating} / 5.0`,             bg: 'bg-green-50',   border: 'border-green-200'  },
    { icon: <TrendingUp size={22} className="text-purple-600" />, label: 'เหรียญในตลาด',           value: coins.filter(c => c.status === 'available').length, bg: 'bg-purple-50', border: 'border-purple-200' },
  ]

  const orderStatusConfig = {
    pending:   { label: 'รอดำเนินการ', variant: 'gold'  as const, icon: <Clock size={12} /> },
    paid:      { label: 'ชำระแล้ว',    variant: 'blue'  as const, icon: <CheckCircle size={12} /> },
    released:  { label: 'ปล่อยเงินแล้ว', variant: 'green' as const, icon: <CheckCircle size={12} /> },
    refunded:  { label: 'คืนเงินแล้ว', variant: 'gray'  as const, icon: null },
  }
  const shipStatusConfig = {
    pending:   { label: 'รอจัดส่ง',  variant: 'gold'  as const },
    packed:    { label: 'แพ็คแล้ว',  variant: 'blue'  as const },
    shipped:   { label: 'จัดส่งแล้ว', variant: 'green' as const },
    delivered: { label: 'ถึงแล้ว',   variant: 'green' as const },
  }

  return (
    <div className="min-h-screen bg-[#FDF8EE]">
      {/* Header */}
      <div className="dark-gradient text-white py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-yellow-800/40 flex items-center justify-center text-2xl font-black text-[#F0D080]">
              {MOCK_SELLER.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-[#F0D080]">{MOCK_SELLER.name}</h1>
                {MOCK_SELLER.verified_seller && <ShieldCheck size={18} className="text-green-400" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <StarRating score={5} size="sm" />
                <span className="text-yellow-200/70 text-xs">{MOCK_SELLER.rating} · {MOCK_SELLER.total_sales} รายการขาย</span>
              </div>
            </div>
          </div>
          <Link href="/sell/new">
            <Button variant="gold" size="md">
              <Plus size={16} />
              {t.seller.add_coin}
            </Button>
          </Link>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-yellow-100 sticky top-16 z-10">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {tabs.map(tb => (
            <button
              key={tb.id}
              onClick={() => setTab(tb.id)}
              className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${tab === tb.id ? 'border-yellow-500 text-yellow-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {tb.icon}
              {tb.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* ─── OVERVIEW TAB ─── */}
        {tab === 'overview' && (
          <div className="space-y-8">
            {/* Stats grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {STAT_CARDS.map((card, i) => (
                <div key={i} className={`${card.bg} ${card.border} border rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                      {card.icon}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gray-900">{card.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{card.label}</div>
                </div>
              ))}
            </div>

            {/* Revenue chart (simple bar) */}
            <div className="bg-white rounded-2xl border border-yellow-100 p-6">
              <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
                <TrendingUp size={18} className="text-yellow-600" />
                รายได้รายเดือน (฿)
              </h3>
              <div className="flex items-end gap-3 h-32">
                {[28000, 35000, 42000, 38000, 55000, 48750].map((val, i) => {
                  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.']
                  const maxVal = 55000
                  const isLast = i === 5
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="text-xs font-bold text-gray-600">฿{(val / 1000).toFixed(0)}K</div>
                      <div
                        className={`w-full rounded-t-lg ${isLast ? 'gold-gradient' : 'bg-yellow-100'}`}
                        style={{ height: `${(val / maxVal) * 100}%`, minHeight: 8 }}
                      />
                      <div className="text-xs text-gray-400">{months[i]}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Recent orders summary */}
            <div className="bg-white rounded-2xl border border-yellow-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-gray-900">คำสั่งซื้อล่าสุด</h3>
                <button onClick={() => setTab('orders')} className="text-sm text-yellow-700 hover:underline">ดูทั้งหมด</button>
              </div>
              <div className="space-y-3">
                {MOCK_ORDERS.map(order => {
                  const ps = orderStatusConfig[order.payment_status]
                  return (
                    <div key={order.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-yellow-50 overflow-hidden relative shrink-0">
                        {order.coin?.images?.[0] && <Image src={order.coin.images[0]} alt="" fill className="object-cover" sizes="40px" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 text-sm truncate">{order.coin?.title_th}</div>
                        <div className="text-xs text-gray-500">{order.shipping_address.country} · #{order.id.slice(-6)}</div>
                      </div>
                      <Badge variant={ps.variant}>{ps.label}</Badge>
                      <div className="font-bold text-gray-800 text-sm">฿{order.total_thb.toLocaleString()}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ─── COINS TAB ─── */}
        {tab === 'coins' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{coins.length} รายการ</p>
              <Link href="/sell/new">
                <Button variant="gold" size="sm"><Plus size={14} />{t.seller.add_coin}</Button>
              </Link>
            </div>

            <div className="bg-white rounded-2xl border border-yellow-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-yellow-50 border-b border-yellow-100">
                  <tr>
                    {['เหรียญ', 'ราคา', 'สถานะ', 'ยอดชม', 'การดำเนินการ'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-bold text-gray-700 text-xs uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coins.map(coin => (
                    <tr key={coin.id} className="hover:bg-yellow-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-yellow-50 shrink-0">
                            {coin.images?.[0] && <Image src={coin.images[0]} alt="" fill className="object-cover" sizes="40px" />}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 line-clamp-1">{coin.title_th}</div>
                            <div className="text-xs text-gray-400">{coin.temple_th}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold text-[#8B6914]">฿{coin.price_thb.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={coin.status === 'available' ? 'green' : coin.status === 'reserved' ? 'gold' : 'gray'}>
                          {coin.status === 'available' ? 'มีของ' : coin.status === 'reserved' ? 'จองแล้ว' : 'ขายแล้ว'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-gray-500"><Eye size={13} />{coin.view_count}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/coins/${coin.id}`}>
                            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-800">
                              <Eye size={15} />
                            </button>
                          </Link>
                          <button className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600">
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setCoins(prev => prev.filter(c => c.id !== coin.id))}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── ORDERS TAB ─── */}
        {tab === 'orders' && (
          <div className="space-y-4">
            {MOCK_ORDERS.map(order => {
              const ps = orderStatusConfig[order.payment_status]
              const ss = shipStatusConfig[order.shipping_status]
              return (
                <div key={order.id} className="bg-white rounded-2xl border border-yellow-100 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="font-bold text-gray-500 text-xs mb-1">ORDER #{order.id.toUpperCase().slice(-8)}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant={ps.variant}>{ps.label}</Badge>
                        <Badge variant={ss.variant}>{ss.label}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-[#8B6914]">฿{order.total_thb.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('th-TH')}</div>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-4">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-yellow-50 shrink-0">
                      {order.coin?.images?.[0] && <Image src={order.coin.images[0]} alt="" fill className="object-cover" sizes="56px" />}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800">{order.coin?.title_th}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        📦 {order.shipping_address.name} · {order.shipping_address.city}, {order.shipping_address.country}
                      </div>
                      {order.tracking_number && (
                        <div className="text-xs text-blue-600 mt-1 font-medium">
                          🔍 Tracking: {order.tracking_number}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                    {order.shipping_status === 'pending' && (
                      <Button variant="gold" size="sm">
                        <Truck size={14} /> อัปเดตการจัดส่ง
                      </Button>
                    )}
                    {order.payment_status === 'paid' && order.shipping_status === 'delivered' && (
                      <Button variant="outline" size="sm">
                        <CheckCircle size={14} /> ยืนยันรับเงิน
                      </Button>
                    )}
                    <Button variant="ghost" size="sm">ดูรายละเอียด</Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
