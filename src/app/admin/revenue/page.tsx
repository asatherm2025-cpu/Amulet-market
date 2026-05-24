'use client'
import { useState } from 'react'
import Image from 'next/image'
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Users, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOCK_COINS } from '@/lib/mock-data'

type Period = '7d' | '30d' | '90d' | '1y'

const DAILY_DATA: Record<Period, number[]> = {
  '7d':  [18, 24, 15, 30, 22, 28, 35],
  '30d': [18, 24, 15, 30, 22, 28, 35, 20, 42, 38, 25, 45, 30, 22, 48, 35, 28, 52, 40, 35, 60, 45, 38, 65, 50, 42, 70, 55, 48, 75],
  '90d': Array.from({ length: 90 }, (_, i) => Math.floor(15 + Math.random() * 60 + i * 0.5)),
  '1y':  [280, 350, 420, 380, 550, 490, 620, 580, 710, 650, 800, 740],
}

const PERIOD_LABELS: Record<Period, string[]> = {
  '7d':  ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'],
  '30d': Array.from({ length: 30 }, (_, i) => `${i + 1}`),
  '90d': Array.from({ length: 90 }, (_, i) => `${i + 1}`),
  '1y':  ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'],
}

const TOP_SELLERS = [
  { name: 'อ.สมชาย เซียนพระ', revenue: 186_000, orders: 24, flag: '🇹🇭' },
  { name: 'Wei Zhang',        revenue: 142_500, orders: 18, flag: '🇸🇬' },
  { name: 'นายธนพล ก.',       revenue: 98_000,  orders: 12, flag: '🇹🇭' },
]

const PAYMENT_METHODS = [
  { provider: 'stripe',    label: 'Credit Card', revenue: 285_000, pct: 58, color: 'bg-blue-500' },
  { provider: 'promptpay', label: 'PromptPay',   revenue: 142_000, pct: 29, color: 'bg-green-500' },
  { provider: 'truemoney', label: 'TrueMoney',   revenue: 63_000,  pct: 13, color: 'bg-orange-500' },
]

export default function AdminRevenuePage() {
  const [period, setPeriod] = useState<Period>('30d')

  const data   = DAILY_DATA[period]
  const labels = PERIOD_LABELS[period]
  const maxVal = Math.max(...data)
  const totalRevenue = data.reduce((s, v) => s + v, 0) * 1000
  const prevTotal    = totalRevenue * 0.87
  const growth       = ((totalRevenue - prevTotal) / prevTotal * 100).toFixed(1)
  const isPositive   = Number(growth) >= 0

  const STAT_CARDS = [
    {
      label:   'รายได้รวม',
      value:   `฿${(totalRevenue / 1000).toFixed(0)}K`,
      sub:     `${isPositive ? '▲' : '▼'} ${growth}% จากช่วงก่อน`,
      icon:    <DollarSign size={20} className="text-yellow-400" />,
      bg:      'border-yellow-500/20',
      positive: isPositive,
    },
    {
      label:   'จำนวน Orders',
      value:   `${Math.round(data.length * 1.4)}`,
      sub:     'คำสั่งซื้อสำเร็จ',
      icon:    <ShoppingBag size={20} className="text-green-400" />,
      bg:      'border-green-500/20',
      positive: true,
    },
    {
      label:   'Platform Fee',
      value:   `฿${(totalRevenue * 0.03 / 1000).toFixed(0)}K`,
      sub:     '3% ของยอดขาย',
      icon:    <Percent size={20} className="text-purple-400" />,
      bg:      'border-purple-500/20',
      positive: true,
    },
    {
      label:   'Avg. Order',
      value:   `฿${Math.round(totalRevenue / data.length / 1000).toFixed(0)}K`,
      sub:     'ต่อคำสั่งซื้อ',
      icon:    <TrendingUp size={20} className="text-blue-400" />,
      bg:      'border-blue-500/20',
      positive: true,
    },
  ]

  // Show fewer bars for readability
  const showEvery = period === '90d' ? 10 : period === '30d' ? 5 : 1
  const chartData = data.filter((_, i) => i % showEvery === 0 || i === data.length - 1)
  const chartLabels = labels.filter((_, i) => i % showEvery === 0 || i === labels.length - 1)
  const chartMax = Math.max(...chartData)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">Revenue Analytics</h1>
          <p className="text-gray-500 text-sm">ข้อมูลรายได้และธุรกรรม</p>
        </div>
        {/* Period selector */}
        <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
          {(['7d', '30d', '90d', '1y'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                period === p ? 'bg-yellow-500/20 text-yellow-400' : 'text-gray-400 hover:text-white'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, i) => (
          <div key={i} className={`bg-gray-900 border ${card.bg} rounded-2xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center">
                {card.icon}
              </div>
              {card.positive
                ? <TrendingUp size={14} className="text-green-400" />
                : <TrendingDown size={14} className="text-red-400" />
              }
            </div>
            <div className="text-xl font-black text-white">{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
            <div className={`text-xs mt-0.5 ${card.positive ? 'text-green-400' : 'text-red-400'}`}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h3 className="text-white font-black mb-6">
          รายได้ ({period === '1y' ? 'รายเดือน' : 'รายวัน'}) — หน่วย: พันบาท
        </h3>
        <div className="flex items-end gap-1 h-48 overflow-hidden">
          {chartData.map((val, i) => {
            const pct = (val / chartMax) * 100
            const isLast = i === chartData.length - 1
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                {/* Tooltip */}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  ฿{val}K
                </div>
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all',
                    isLast ? 'gold-gradient shadow-lg' : 'bg-gray-700 hover:bg-gray-600'
                  )}
                  style={{ height: `${pct}%`, minHeight: 4 }}
                />
                <div className="text-[9px] text-gray-600 truncate w-full text-center">
                  {chartLabels[i]}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Sellers */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-black mb-4 flex items-center gap-2">
            <Users size={16} className="text-yellow-400" />
            Top Sellers
          </h3>
          <div className="space-y-3">
            {TOP_SELLERS.map((seller, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl font-black text-gray-600">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                  {seller.flag}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{seller.name}</div>
                  <div className="text-xs text-gray-500">{seller.orders} orders</div>
                </div>
                <div className="text-sm font-black text-[#C9A84C]">
                  ฿{(seller.revenue / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <h3 className="text-white font-black mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-green-400" />
            ช่องทางชำระเงิน
          </h3>
          <div className="space-y-4">
            {PAYMENT_METHODS.map(pm => (
              <div key={pm.provider}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-white">{pm.label}</span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-300">฿{(pm.revenue / 1000).toFixed(0)}K</span>
                    <span className="text-xs text-gray-500 ml-2">{pm.pct}%</span>
                  </div>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${pm.color} rounded-full`}
                    style={{ width: `${pm.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
