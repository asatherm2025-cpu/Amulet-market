'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'

export default function LoginPage() {
  const { t } = useLang()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPass, setShowPass] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  return (
    <div className="min-h-screen bg-[#FDF8EE] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🪙</div>
          <h1 className="text-2xl font-black text-[#1A1208]">SIAM COIN</h1>
          <p className="text-gray-500 text-sm mt-1">ตลาดเหรียญพระเครื่องไทย</p>
        </div>

        <div className="bg-white rounded-3xl border border-yellow-100 shadow-lg p-8">
          {/* Mode toggle */}
          <div className="flex bg-gray-100 rounded-2xl p-1 mb-6">
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${mode === m ? 'bg-white shadow text-[#1A1208]' : 'text-gray-500'}`}
              >
                {m === 'login' ? t.nav.login : 'สมัครสมาชิก'}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">ชื่อ - นามสกุล</label>
                <input
                  value={name} onChange={e => setName(e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">อีเมล</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">รหัสผ่าน</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                <button onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          <Button variant="gold" size="lg" className="w-full mt-6">
            <LogIn size={16} />
            {mode === 'login' ? t.nav.login : 'สมัครสมาชิก'}
          </Button>

          {/* Social login */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">หรือ</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: '🟢', label: 'LINE' },
              { icon: '🔵', label: 'Facebook' },
            ].map(s => (
              <button key={s.label} className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            {mode === 'login' ? 'ยังไม่มีบัญชี? ' : 'มีบัญชีแล้ว? '}
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-yellow-700 font-bold hover:underline">
              {mode === 'login' ? 'สมัครสมาชิก' : t.nav.login}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2025 SIAM COIN · <Link href="/terms" className="hover:underline">Terms</Link> · <Link href="/privacy" className="hover:underline">Privacy</Link>
        </p>
      </div>
    </div>
  )
}
