'use client'
import { useState } from 'react'
import { AlertTriangle, CheckCircle, Shield, Eye, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FraudAlert {
  id:          string
  coinId?:     string
  userId?:     string
  severity:    'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  type:        string
  description: string
  isResolved:  boolean
  createdAt:   string
  coinTitle?:  string
  userName?:   string
}

const MOCK_ALERTS: FraudAlert[] = [
  {
    id: 'f1', severity: 'CRITICAL', type: 'fake_cert',
    description: 'พบใบรับรองปลอมบนเหรียญหลวงปู่ทวด รุ่นแรก',
    isResolved: false, createdAt: '2025-05-23',
    coinTitle: 'เหรียญหลวงปู่ทวด รุ่นแรก', userName: 'Suspicious User',
  },
  {
    id: 'f2', severity: 'HIGH', type: 'counterfeit_coin',
    description: 'รูปภาพซ้ำกับเหรียญที่ขายไปแล้วในระบบ',
    isResolved: false, createdAt: '2025-05-22',
    coinTitle: 'เหรียญหลวงพ่อคูณ รุ่นคูณทวี', userName: 'นายธนพล ก.',
  },
  {
    id: 'f3', severity: 'MEDIUM', type: 'price_manipulation',
    description: 'ราคาสูงกว่าตลาดมากกว่า 300% โดยไม่มีเหตุผล',
    isResolved: false, createdAt: '2025-05-21',
    coinTitle: 'เหรียญหลวงพ่อเงิน วัดบางคลาน',
  },
  {
    id: 'f4', severity: 'LOW', type: 'suspicious_seller',
    description: 'ผู้ขายสมัครใหม่แต่มีเหรียญราคาสูงจำนวนมาก',
    isResolved: true, createdAt: '2025-05-18',
    userName: 'New Seller',
  },
]

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'bg-red-500/20 text-red-400 border-red-500/40',      label: 'วิกฤต',  dot: 'bg-red-500' },
  HIGH:     { color: 'bg-orange-500/20 text-orange-400 border-orange-500/40', label: 'สูง',    dot: 'bg-orange-500' },
  MEDIUM:   { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40', label: 'กลาง',  dot: 'bg-yellow-500' },
  LOW:      { color: 'bg-gray-700 text-gray-400 border-gray-600',           label: 'ต่ำ',    dot: 'bg-gray-500' },
}

const TYPE_LABELS: Record<string, string> = {
  fake_cert:           '🔴 ใบรับรองปลอม',
  counterfeit_coin:    '⚠️ เหรียญปลอม',
  price_manipulation:  '💰 ราคาผิดปกติ',
  duplicate_image:     '📸 รูปซ้ำ',
  suspicious_seller:   '👤 ผู้ขายน่าสงสัย',
  chargeback_dispute:  '💳 Chargeback',
}

export default function AdminFraudPage() {
  const [alerts, setAlerts]   = useState<FraudAlert[]>(MOCK_ALERTS)
  const [showResolved, setShowResolved] = useState(false)
  const [sevFilter, setSevFilter] = useState('')

  const filtered = alerts.filter(a =>
    (showResolved ? true : !a.isResolved) &&
    (!sevFilter || a.severity === sevFilter)
  )

  const unresolvedCount = alerts.filter(a => !a.isResolved).length

  const resolve = async (id: string) => {
    try {
      await fetch(`/api/fraud/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution: 'Resolved by admin' }),
      })
    } catch { /* mock */ }
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true } : a))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <AlertTriangle size={22} className="text-red-400" />
            Fraud Alerts
          </h1>
          <p className="text-gray-500 text-sm">
            {unresolvedCount > 0
              ? <span className="text-red-400 font-bold">⚡ {unresolvedCount} รายการรอดำเนินการ</span>
              : '✅ ไม่มีรายการค้างดำเนินการ'
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
          <button
            key={sev}
            onClick={() => setSevFilter(sev)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border',
              sevFilter === sev
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                : 'bg-gray-800 text-gray-400 border-transparent hover:text-white'
            )}
          >
            {sev === '' ? 'ทั้งหมด' : SEVERITY_CONFIG[sev as keyof typeof SEVERITY_CONFIG].label}
          </button>
        ))}
        <label className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-xl cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={e => setShowResolved(e.target.checked)}
            className="rounded"
          />
          <span className="text-xs text-gray-400">รวมที่แก้ไขแล้ว</span>
        </label>
      </div>

      {/* Alert cards */}
      <div className="space-y-3">
        {filtered.map(alert => {
          const sev = SEVERITY_CONFIG[alert.severity]
          return (
            <div
              key={alert.id}
              className={cn(
                'bg-gray-900 border rounded-2xl p-5 transition-all',
                alert.isResolved ? 'border-gray-800 opacity-60' : 'border-gray-700'
              )}
            >
              <div className="flex items-start gap-4">
                {/* Severity dot */}
                <div className={cn('w-3 h-3 rounded-full mt-1.5 shrink-0 shadow-lg', sev.dot, !alert.isResolved && 'animate-pulse')} />

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full border', sev.color)}>
                      {sev.label}
                    </span>
                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">
                      {TYPE_LABELS[alert.type] ?? alert.type}
                    </span>
                    {alert.isResolved && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle size={11} /> แก้ไขแล้ว
                      </span>
                    )}
                    <span className="text-xs text-gray-600 ml-auto">
                      {new Date(alert.createdAt).toLocaleDateString('th-TH')}
                    </span>
                  </div>

                  <p className="text-sm text-white font-medium mb-1">{alert.description}</p>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {alert.coinTitle && <span>🪙 {alert.coinTitle}</span>}
                    {alert.userName  && <span>👤 {alert.userName}</span>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              {!alert.isResolved && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-gray-800">
                  <button
                    onClick={() => resolve(alert.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl text-xs font-bold hover:bg-green-600/30 transition-colors"
                  >
                    <CheckCircle size={13} /> Mark Resolved
                  </button>
                  {alert.coinId && (
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/30 rounded-xl text-xs font-bold hover:bg-red-600/30 transition-colors">
                      <Shield size={13} /> Delist Coin
                    </button>
                  )}
                  {alert.userId && (
                    <button className="flex items-center gap-1.5 px-4 py-2 bg-orange-600/20 text-orange-400 border border-orange-600/30 rounded-xl text-xs font-bold hover:bg-orange-600/30 transition-colors">
                      Ban User
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-gray-500">ไม่มีรายการ Fraud ที่รอดำเนินการ</p>
        </div>
      )}
    </div>
  )
}
