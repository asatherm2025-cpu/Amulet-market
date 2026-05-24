'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, TrendingUp, ShoppingBag, AlertTriangle,
  ShieldCheck, Coins, ArrowUpRight, RefreshCw
} from 'lucide-react'

interface Stats {
  users:    { total: number; newThisMonth: number }
  coins:    { available: number }
  orders:   { completed: number; revenue: number }
  auctions: { active: number }
  certs:    { pending: number }
  fraud:    { unresolved: number }
  monthlyRevenue: { amount: number; orders: number }
}

const MOCK_STATS: Stats = {
  users:    { total: 1284, newThisMonth: 47 },
  coins:    { available: 342 },
  orders:   { completed: 891, revenue: 4_280_500 },
  auctions: { active: 12 },
  certs:    { pending: 8 },
  fraud:    { unresolved: 3 },
  monthlyRevenue: { amount: 486_000, orders: 38 },
}

const MONTHLY_DATA = [28, 35, 42, 38, 55, 49, 62, 58, 71, 65, 80, 74]
const MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']

export default function AdminDashboard() {
  const [stats, setStats]       = useState<Stats>(MOCK_STATS)
  const [loading, setLoading]   = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const json = await res.json()
        if (json.success) setStats(json.data)
      }
    } catch { /* use mock */ }
    setLastUpdated(new Date())
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  const STAT_CARDS = [
    {
      label:    'ผู้ใช้ทั้งหมด',
      value:    stats.users.total.toLocaleString(),
      sub:      `+${stats.users.newThisMonth} เดือนนี้`,
      icon:     <Users size={20} className="text-blue-400" />,
      bg:       'bg-blue-500/10 border-blue-500/20',
      href:     '/admin/users',
    },
    {
      label:    'เหรียญในตลาด',
      value:    stats.coins.available.toLocaleString(),
      sub:      `${stats.certs.pending} รอ verify`,
      icon:     <Coins size={20} className="text-yellow-400" />,
      bg:       'bg-yellow-500/10 border-yellow-500/20',
      href:     '/admin/coins',
    },
    {
      label:    'คำสั่งซื้อสำเร็จ',
      value:    stats.orders.completed.toLocaleString(),
      sub:      `฿${(stats.orders.revenue / 1_000_000).toFixed(1)}M รายได้รวม`,
      icon:     <ShoppingBag size={20} className="text-green-400" />,
      bg:       'bg-green-500/10 border-green-500/20',
      href:     '/admin/orders',
    },
    {
      label:    'รายได้เดือนนี้',
      value:    `฿${(stats.monthlyRevenue.amount / 1000).toFixed(0)}K`,
      sub:      `${stats.monthlyRevenue.orders} รายการ`,
      icon:     <TrendingUp size={20} className="text-purple-400" />,
      bg:       'bg-purple-500/10 border-purple-500/20',
      href:     '/admin/revenue',
    },
  ]

  const ALERT_CARDS = [
    {
      label:  'Fraud Alerts',
      value:  stats.fraud.unresolved,
      color:  'text-red-400',
      bg:     'bg-red-500/10 border-red-500/30',
      icon:   <AlertTriangle size={16} />,
      href:   '/admin/fraud',
      urgent: stats.fraud.unresolved > 0,
    },
    {
      label:  'รอรับรองเหรียญ',
      value:  stats.certs.pending,
      color:  'text-yellow-400',
      bg:     'bg-yellow-500/10 border-yellow-500/30',
      icon:   <ShieldCheck size={16} />,
      href:   '/admin/coins?status=PENDING_REVIEW',
      urgent: false,
    },
    {
      label:  'Auctions ที่กำลังไลฟ์',
      value:  stats.auctions.active,
      color:  'text-green-400',
      bg:     'bg-green-500/10 border-green-500/30',
      icon:   <TrendingUp size={16} />,
      href:   '/market?isAuction=true',
      urgent: false,
    },
  ]

  const maxBar = Math.max(...MONTHLY_DATA)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">ภาพรวมระบบ</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            อัปเดตล่าสุด: {lastUpdated.toLocaleTimeString('th-TH')}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-xl text-sm hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          รีเฟรช
        </button>
      </div>

      {/* Alert row */}
      <div className="grid grid-cols-3 gap-3">
        {ALERT_CARDS.map(card => (
          <Link key={card.href} href={card.href}>
            <div className={`relative p-4 rounded-2xl border ${card.bg} hover:opacity-90 transition-opacity cursor-pointer`}>
              {card.urgent && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
              <div className={`flex items-center gap-2 ${card.color} text-sm font-semibold mb-1`}>
                {card.icon}
                {card.label}
              </div>
              <div className={`text-3xl font-black ${card.color}`}>{card.value}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <Link key={card.href} href={card.href}>
            <div className={`p-5 rounded-2xl border ${card.bg} hover:opacity-90 transition-opacity cursor-pointer`}>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center">
                  {card.icon}
                </div>
                <ArrowUpRight size={16} className="text-gray-600" />
              </div>
              <div className="text-2xl font-black text-white mb-1">{card.value}</div>
              <div className="text-xs text-gray-400">{card.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{card.sub}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Revenue bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-black flex items-center gap-2">
            <TrendingUp size={18} className="text-yellow-400" />
            รายได้รายเดือน (แสนบาท)
          </h3>
          <Link href="/admin/revenue" className="text-xs text-yellow-500 hover:underline">
            ดูรายละเอียด →
          </Link>
        </div>
        <div className="flex items-end gap-2 h-40">
          {MONTHLY_DATA.map((val, i) => {
            const isCurrentMonth = i === new Date().getMonth()
            const pct = (val / maxBar) * 100
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="text-[10px] text-gray-500">{val}K</div>
                <div
                  className={`w-full rounded-t-lg transition-all ${isCurrentMonth ? 'gold-gradient' : 'bg-gray-700'}`}
                  style={{ height: `${pct}%`, minHeight: 4 }}
                />
                <div className={`text-[10px] ${isCurrentMonth ? 'text-yellow-400 font-bold' : 'text-gray-600'}`}>
                  {MONTHS[i]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'อนุมัติเหรียญ',    href: '/admin/coins?status=PENDING_REVIEW', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
          { label: 'จัดการ Users',     href: '/admin/users',                        color: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
          { label: 'Resolve Fraud',    href: '/admin/fraud',                        color: 'bg-red-500/10 border-red-500/20 text-red-400' },
          { label: 'Revenue Report',  href: '/admin/revenue',                      color: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
        ].map(a => (
          <Link key={a.href} href={a.href}>
            <div className={`p-4 rounded-xl border ${a.color} text-center text-sm font-bold hover:opacity-80 transition-opacity cursor-pointer`}>
              {a.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
