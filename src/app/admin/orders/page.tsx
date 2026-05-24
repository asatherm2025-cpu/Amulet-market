'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Search, RefreshCw, Package, Truck, CheckCircle, XCircle, Clock, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MOCK_ORDERS } from '@/lib/mock-data'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_PAYMENT: { label: 'รอชำระ',     color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: <Clock size={11} /> },
  PAID:            { label: 'ชำระแล้ว',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     icon: <Package size={11} /> },
  SHIPPED:         { label: 'จัดส่งแล้ว', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: <Truck size={11} /> },
  DELIVERED:       { label: 'ถึงแล้ว',    color: 'bg-green-500/20 text-green-400 border-green-500/30',   icon: <CheckCircle size={11} /> },
  COMPLETED:       { label: 'เสร็จ',      color: 'bg-green-500/20 text-green-400 border-green-500/30',   icon: <CheckCircle size={11} /> },
  CANCELLED:       { label: 'ยกเลิก',     color: 'bg-gray-700 text-gray-400 border-gray-600',            icon: <XCircle size={11} /> },
  REFUNDED:        { label: 'คืนเงิน',    color: 'bg-red-500/20 text-red-400 border-red-500/30',         icon: <RotateCcw size={11} /> },
  DISPUTED:        { label: 'ข้อพิพาท',   color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <XCircle size={11} /> },
}

export default function AdminOrdersPage() {
  const [orders] = useState(MOCK_ORDERS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      o.shipping_address.country.toLowerCase().includes(q)
    const matchStatus = !statusFilter || o.payment_status.toUpperCase() === statusFilter
    return matchSearch && matchStatus
  })

  const totalRevenue = filtered.reduce((s, o) => s + o.total_thb, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">คำสั่งซื้อทั้งหมด</h1>
          <p className="text-gray-500 text-sm">
            {filtered.length} รายการ · รวม ฿{totalRevenue.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหา order ID, ประเทศ..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm focus:outline-none"
        >
          <option value="">ทุกสถานะ</option>
          <option value="PENDING">รอชำระ</option>
          <option value="ESCROW_HELD">ถือเงิน</option>
          <option value="RELEASED">ปล่อยแล้ว</option>
          <option value="REFUNDED">คืนเงิน</option>
        </select>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map(order => {
          const statusKey = order.payment_status.toUpperCase()
          const statusCfg = STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.CANCELLED

          return (
            <div key={order.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition-colors">
              <div className="flex flex-wrap items-start gap-4">
                {/* Coin image */}
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-800 shrink-0">
                  {order.coin?.images?.[0] && (
                    <Image src={order.coin.images[0]} alt="" fill className="object-cover" sizes="56px" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-gray-500 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                    <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1', statusCfg.color)}>
                      {statusCfg.icon}
                      {statusCfg.label}
                    </span>
                    <span className="text-xs text-gray-600">
                      {order.shipping_address.country} · {new Date(order.created_at).toLocaleDateString('th-TH')}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white line-clamp-1">
                    {order.coin?.title_th ?? 'เหรียญ'}
                  </p>
                  <p className="text-xs text-gray-500">
                    ผู้รับ: {order.shipping_address.name} · {order.shipping_address.city}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-black text-[#C9A84C]">฿{order.total_thb.toLocaleString()}</div>
                  {order.tracking_number && (
                    <div className="text-xs text-blue-400 font-mono mt-0.5">{order.tracking_number}</div>
                  )}
                </div>
              </div>

              {/* Admin actions */}
              <div className="flex gap-2 mt-3 pt-3 border-t border-gray-800">
                {order.payment_status === 'paid' && (
                  <button
                    onClick={() => fetch(`/api/escrow/${order.id}/release`, { method: 'POST' })}
                    className="px-3 py-1.5 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-xs font-bold hover:bg-green-600/30 transition-colors"
                  >
                    ปล่อย Escrow
                  </button>
                )}
                <button
                  onClick={() => fetch(`/api/escrow/${order.id}/refund`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reason: 'Admin refund' }),
                  })}
                  className="px-3 py-1.5 bg-red-600/20 text-red-400 border border-red-600/30 rounded-lg text-xs font-bold hover:bg-red-600/30 transition-colors"
                >
                  คืนเงิน
                </button>
                <span className="ml-auto text-xs text-gray-600 self-center">
                  Escrow: {order.escrow_fee_thb > 0 ? `฿${order.escrow_fee_thb}` : '—'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-600">ไม่พบคำสั่งซื้อ</div>
      )}
    </div>
  )
}
