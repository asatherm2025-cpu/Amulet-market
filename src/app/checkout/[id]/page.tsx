'use client'
import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Lock, Package, MapPin, CreditCard, CheckCircle } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { MOCK_COINS } from '@/lib/mock-data'

const PAYMENT_METHODS = [
  { id: 'stripe',   label: 'Credit / Debit Card', icon: '💳', sub: 'Visa, Mastercard, Amex' },
  { id: 'promptpay',label: 'PromptPay',           icon: '📱', sub: 'สแกน QR Code' },
  { id: 'wechat',   label: 'WeChat Pay',          icon: '💚', sub: '微信支付' },
  { id: 'alipay',   label: 'Alipay',              icon: '🔵', sub: '支付宝' },
]

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useLang()
  const coin = MOCK_COINS.find(c => c.id === id) ?? MOCK_COINS[0]
  const price = formatPrice(coin.price_thb)

  const [payMethod, setPayMethod] = useState('stripe')
  const [done, setDone] = useState(false)
  const [form, setForm] = useState({
    name: '', address: '', city: '', country: 'Thailand',
    postal: '', phone: '',
  })

  const shippingFee = 350
  const escrowFee   = Math.round(coin.price_thb * 0.03)
  const total       = coin.price_thb + shippingFee + escrowFee

  if (done) return (
    <div className="min-h-screen bg-[#FDF8EE] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-green-200 p-10 max-w-md w-full text-center shadow-lg">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="text-green-500" size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">ชำระเงินสำเร็จ!</h2>
        <p className="text-gray-500 mb-2">Order #SC-{Date.now().toString().slice(-6)}</p>
        <p className="text-sm text-gray-500 mb-8">
          เงินของคุณถูกเก็บใน Escrow อย่างปลอดภัย<br />
          ผู้ขายจะจัดส่งภายใน 1-3 วันทำการ
        </p>
        <div className="bg-gray-50 rounded-2xl p-4 mb-6 text-left space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">สินค้า</span><span className="font-bold">฿{coin.price_thb.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">ค่าส่ง</span><span>฿{shippingFee}</span></div>
          <div className="flex justify-between border-t pt-2"><span className="font-bold">รวม</span><span className="font-black text-[#8B6914]">฿{total.toLocaleString()}</span></div>
        </div>
        <Link href="/market"><Button variant="gold" size="lg" className="w-full">กลับหน้าตลาด</Button></Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDF8EE]">
      <div className="dark-gradient text-white py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href={`/coins/${id}`}><ArrowLeft size={20} className="text-yellow-300 hover:text-white" /></Link>
          <h1 className="text-2xl font-black text-[#F0D080]">{t.order.summary}</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* ─── LEFT: Form ─── */}
        <div className="lg:col-span-3 space-y-6">
          {/* Shipping address */}
          <div className="bg-white rounded-2xl border border-yellow-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <MapPin className="text-yellow-600" size={18} />
              <h3 className="font-black text-gray-800">{t.order.shipping_address}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'name',    label: 'ชื่อ - นามสกุล', placeholder: 'John Smith', full: true },
                { key: 'address', label: 'ที่อยู่',          placeholder: '123 Main St', full: true },
                { key: 'city',    label: 'เมือง',            placeholder: 'Bangkok' },
                { key: 'country', label: 'ประเทศ',           placeholder: 'Thailand' },
                { key: 'postal',  label: 'รหัสไปรษณีย์',     placeholder: '10100' },
                { key: 'phone',   label: 'เบอร์โทรศัพท์',    placeholder: '+66812345678' },
              ].map(f => (
                <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                  <input
                    value={form[f.key as keyof typeof form]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl border border-yellow-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <CreditCard className="text-yellow-600" size={18} />
              <h3 className="font-black text-gray-800">{t.order.payment_method}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(pm => (
                <button
                  key={pm.id}
                  onClick={() => setPayMethod(pm.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${payMethod === pm.id ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300'}`}
                >
                  <span className="text-2xl">{pm.icon}</span>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{pm.label}</div>
                    <div className="text-xs text-gray-400">{pm.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Escrow note */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <Lock className="text-blue-500 shrink-0 mt-0.5" size={18} />
            <div>
              <div className="font-bold text-blue-800 text-sm mb-1">ระบบ Escrow ปกป้องการซื้อของคุณ</div>
              <p className="text-blue-700 text-xs leading-relaxed">{t.order.escrow_note}</p>
            </div>
          </div>
        </div>

        {/* ─── RIGHT: Summary ─── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-yellow-100 p-5 sticky top-20">
            {/* Coin preview */}
            <div className="flex gap-3 mb-5 pb-5 border-b border-gray-100">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-yellow-50 shrink-0">
                {coin.images?.[0] && <Image src={coin.images[0]} alt="" fill className="object-cover" sizes="64px" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm line-clamp-2">{coin.title_th}</p>
                <p className="text-xs text-gray-500 mt-1">{coin.temple_th}</p>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="space-y-3 text-sm mb-5">
              <div className="flex justify-between">
                <span className="text-gray-500">ราคาสินค้า</span>
                <span className="font-semibold">฿{coin.price_thb.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.order.shipping_fee}</span>
                <span className="font-semibold">฿{shippingFee}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{t.order.escrow_fee}</span>
                <span className="font-semibold">฿{escrowFee}</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-dashed border-gray-200 text-base">
                <span className="font-black text-gray-800">{t.order.total}</span>
                <div className="text-right">
                  <div className="font-black text-[#8B6914]">฿{total.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">~${Math.round(total / 37)} USD</div>
                </div>
              </div>
            </div>

            <Button
              variant="gold"
              size="lg"
              className="w-full text-base"
              onClick={() => setDone(true)}
            >
              <Lock size={16} />
              {t.order.pay_now}
            </Button>

            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-400">
              <span>🔒 SSL Secured</span>
              <span>🛡️ Escrow</span>
              <span>✅ Certified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
