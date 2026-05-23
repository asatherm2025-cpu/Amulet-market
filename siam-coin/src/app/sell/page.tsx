'use client'
import { useState } from 'react'
import { Upload, X, CheckCircle, Info } from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'

const MATERIALS = ['เนื้อทองแดง', 'เนื้อเงิน', 'เนื้อทอง', 'เนื้ออัลปาก้า', 'เนื้อทองเหลือง', 'เนื้อผสม']
const MONKS = ['หลวงปู่ทวด', 'หลวงพ่อเงิน', 'หลวงพ่อคูณ', 'สมเด็จโต', 'หลวงปู่ศุข', 'หลวงพ่อโสธร', 'อื่นๆ']

export default function SellPage() {
  const { t } = useLang()
  const [submitted, setSubmitted] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [form, setForm] = useState({
    title_th: '', title_en: '', monk: '', temple: '',
    year_th: '', material: '', condition: '4',
    price: '', description_th: '', description_en: '',
  })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  if (submitted) return (
    <div className="min-h-screen bg-[#FDF8EE] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center border border-green-200 shadow-lg">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-green-500" size={40} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">ลงประกาศสำเร็จ!</h2>
        <p className="text-gray-500 text-sm mb-6">ทีมงานจะตรวจสอบและอนุมัติเหรียญของคุณภายใน 24 ชั่วโมง</p>
        <div className="flex gap-3">
          <Button variant="outline" size="md" className="flex-1" onClick={() => setSubmitted(false)}>ลงเหรียญอื่น</Button>
          <Button variant="gold" size="md" className="flex-1" onClick={() => window.location.href='/dashboard'}>ดูแดชบอร์ด</Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#FDF8EE]">
      <div className="dark-gradient text-white py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-black text-[#F0D080]">{t.seller.add_coin}</h1>
          <p className="text-yellow-200/60 text-sm mt-1">กรอกข้อมูลเหรียญให้ครบถ้วนเพื่อเพิ่มความน่าเชื่อถือ</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Images upload */}
        <div className="bg-white rounded-2xl border border-yellow-100 p-6">
          <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
            <Upload size={18} className="text-yellow-600" /> รูปภาพเหรียญ
          </h3>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                  className="absolute top-0.5 right-0.5 bg-black/60 rounded-full p-0.5 text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                onClick={() => setImages(p => [...p, `https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=200&q=80&sig=${p.length}`])}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-yellow-300 flex flex-col items-center justify-center text-yellow-500 hover:bg-yellow-50 transition-colors text-xs gap-1"
              >
                <Upload size={18} />
                เพิ่มรูป
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <Info size={12} /> อัปโหลดได้สูงสุด 5 รูป (หน้า/หลัง/ด้านข้าง/รายละเอียด)
          </p>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-yellow-100 p-6 space-y-4">
          <h3 className="font-black text-gray-800">ข้อมูลพื้นฐาน</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'title_th', label: 'ชื่อเหรียญ (ภาษาไทย) *',    placeholder: 'เหรียญหลวงปู่ทวด รุ่น...',    full: true },
              { key: 'title_en', label: 'ชื่อเหรียญ (English)',         placeholder: 'Luang Phu Thuat...',          full: true },
              { key: 'temple',   label: 'วัด *',                        placeholder: 'วัดช้างให้' },
              { key: 'year_th',  label: 'ปีที่สร้าง (พ.ศ.) *',         placeholder: '2515' },
            ].map(f => (
              <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
                <input
                  value={form[f.key as keyof typeof form]}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
            ))}

            {/* Monk select */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">เกจิอาจารย์ *</label>
              <select value={form.monk} onChange={e => set('monk', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="">เลือกเกจิ</option>
                {MONKS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Material select */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">เนื้อเหรียญ *</label>
              <select value={form.material} onChange={e => set('material', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400">
                <option value="">เลือกเนื้อ</option>
                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {/* Condition */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">สภาพเหรียญ *</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => set('condition', String(n))}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold border-2 transition-all ${form.condition === String(n) ? 'gold-gradient border-yellow-500 text-[#1A1208]' : 'border-gray-200 text-gray-500 hover:border-yellow-300'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">1 = คงเดิม / 5 = สวยใหม่</p>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">ราคา (บาท) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">฿</span>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  placeholder="2500"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              {form.price && (
                <p className="text-xs text-gray-400 mt-1">
                  ~${Math.round(Number(form.price) / 37)} USD · ¥{Math.round(Number(form.price) / 5.1)} CNY
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl border border-yellow-100 p-6 space-y-4">
          <h3 className="font-black text-gray-800">รายละเอียดเพิ่มเติม</h3>
          {[
            { key: 'description_th', label: 'รายละเอียด (ภาษาไทย)', placeholder: 'ประวัติเหรียญ สภาพ รายละเอียดพิเศษ...' },
            { key: 'description_en', label: 'Description (English)',  placeholder: 'History, condition, special details...' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-bold text-gray-600 mb-1">{f.label}</label>
              <textarea
                rows={3}
                value={form[f.key as keyof typeof form]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
              />
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <Button variant="outline" size="lg" className="flex-1" onClick={() => window.history.back()}>ยกเลิก</Button>
          <Button
            variant="gold"
            size="lg"
            className="flex-1"
            onClick={() => { if (form.title_th && form.price) setSubmitted(true) }}
          >
            ลงประกาศขาย
          </Button>
        </div>
      </div>
    </div>
  )
}
