'use client'
import { useState } from 'react'
import {
  Search, Shield, ShieldOff, UserCheck, UserX,
  ChevronDown, Filter, RefreshCw, Eye
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminUser {
  id:              string
  name:            string
  email:           string
  role:            string
  country:         string
  isVerifiedSeller: boolean
  isBanned:        boolean
  rating:          number
  totalSales:      number
  createdAt:       string
}

const MOCK_USERS: AdminUser[] = [
  { id: 'u1', name: 'อ.สมชาย เซียนพระ', email: 'somchai@test.com', role: 'SELLER', country: 'TH', isVerifiedSeller: true,  isBanned: false, rating: 4.9, totalSales: 312, createdAt: '2023-01-15' },
  { id: 'u2', name: 'Wei Zhang',         email: 'wei@test.com',     role: 'BUYER',  country: 'SG', isVerifiedSeller: false, isBanned: false, rating: 0,   totalSales: 0,   createdAt: '2024-03-20' },
  { id: 'u3', name: 'Li Mei Chen',       email: 'limei@test.com',   role: 'BUYER',  country: 'CN', isVerifiedSeller: false, isBanned: false, rating: 0,   totalSales: 0,   createdAt: '2024-05-01' },
  { id: 'u4', name: 'นายธนพล ก.',        email: 'thanapol@test.com',role: 'SELLER', country: 'TH', isVerifiedSeller: false, isBanned: false, rating: 4.2, totalSales: 45,  createdAt: '2023-08-10' },
  { id: 'u5', name: 'Suspicious User',   email: 'bad@test.com',     role: 'BUYER',  country: 'XX', isVerifiedSeller: false, isBanned: true,  rating: 0,   totalSales: 0,   createdAt: '2024-06-15' },
]

const ROLE_COLORS: Record<string, string> = {
  ADMIN:  'bg-red-500/20 text-red-400 border-red-500/30',
  EXPERT: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  SELLER: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  BUYER:  'bg-gray-700 text-gray-300 border-gray-600',
}

export default function AdminUsersPage() {
  const [users, setUsers]         = useState<AdminUser[]>(MOCK_USERS)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading]     = useState(false)
  const [actionUser, setActionUser] = useState<string | null>(null)

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRole   = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const updateUser = async (userId: string, data: Partial<AdminUser>) => {
    setActionUser(userId)
    try {
      await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u))
    } catch { /* mock: update locally */ 
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...data } : u))
    }
    setActionUser(null)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">จัดการผู้ใช้</h1>
          <p className="text-gray-500 text-sm">{users.length} ผู้ใช้ทั้งหมด</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อหรืออีเมล..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-200 rounded-xl text-sm focus:outline-none focus:border-yellow-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="px-3 py-2.5 bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-sm focus:outline-none"
        >
          <option value="">ทุก Role</option>
          <option value="ADMIN">ADMIN</option>
          <option value="EXPERT">EXPERT</option>
          <option value="SELLER">SELLER</option>
          <option value="BUYER">BUYER</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/60">
            <tr>
              {['ผู้ใช้', 'Role', 'ประเทศ', 'ขาย', 'คะแนน', 'สถานะ', 'การดำเนินการ'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-semibold text-white text-sm flex items-center gap-2">
                      {user.name}
                      {user.isVerifiedSeller && (
                        <Shield size={12} className="text-green-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[user.role] ?? ROLE_COLORS.BUYER}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{user.country}</td>
                <td className="px-4 py-3 text-gray-300 font-mono text-xs">{user.totalSales}</td>
                <td className="px-4 py-3">
                  {user.rating > 0 ? (
                    <span className="text-yellow-400 text-xs font-bold">⭐ {user.rating}</span>
                  ) : (
                    <span className="text-gray-600 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.isBanned ? (
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                      ถูกแบน
                    </span>
                  ) : (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                      ปกติ
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {/* Verify seller */}
                    {user.role === 'SELLER' && (
                      <button
                        onClick={() => updateUser(user.id, { isVerifiedSeller: !user.isVerifiedSeller })}
                        disabled={actionUser === user.id}
                        title={user.isVerifiedSeller ? 'ยกเลิก verify' : 'Verify seller'}
                        className={cn(
                          'p-1.5 rounded-lg text-xs transition-all',
                          user.isVerifiedSeller
                            ? 'bg-green-900/40 text-green-400 hover:bg-green-900/60'
                            : 'bg-gray-800 text-gray-500 hover:text-green-400 hover:bg-green-900/20'
                        )}
                      >
                        <UserCheck size={14} />
                      </button>
                    )}
                    {/* Promote to Expert */}
                    {user.role === 'SELLER' && (
                      <button
                        onClick={() => updateUser(user.id, { role: 'EXPERT' })}
                        disabled={actionUser === user.id}
                        title="เลื่อนเป็น Expert"
                        className="p-1.5 rounded-lg bg-gray-800 text-gray-500 hover:text-purple-400 hover:bg-purple-900/20 transition-all"
                      >
                        <Shield size={14} />
                      </button>
                    )}
                    {/* Ban / Unban */}
                    <button
                      onClick={() => updateUser(user.id, { isBanned: !user.isBanned })}
                      disabled={actionUser === user.id}
                      title={user.isBanned ? 'ปลดแบน' : 'แบน'}
                      className={cn(
                        'p-1.5 rounded-lg transition-all',
                        user.isBanned
                          ? 'bg-green-900/30 text-green-400 hover:bg-green-900/50'
                          : 'bg-gray-800 text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                      )}
                    >
                      {user.isBanned ? <UserCheck size={14} /> : <UserX size={14} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-600">ไม่พบผู้ใช้</div>
        )}
      </div>
    </div>
  )
}
