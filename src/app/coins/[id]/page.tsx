'use client'
import { use, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShieldCheck, Eye, Heart, MessageCircle,
  ShoppingCart, MapPin, Calendar, Weight, Ruler,
  TrendingUp, Star, ChevronRight, Package, Lock
} from 'lucide-react'
import { useLang } from '@/context/LangContext'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { formatPrice, conditionLabel } from '@/lib/utils'
import { MOCK_COINS, MOCK_PRICE_HISTORY, MOCK_SELLER } from '@/lib/mock-data'

export default function CoinDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t, lang } = useLang()
  const coin = MOCK_COINS.find(c => c.id === id) ?? MOCK_COINS[0]
  const [activeImg, setActiveImg] = useState(0)
  const [watchlisted, setWatchlisted] = useState(false)

  const price = formatPrice(coin.price_thb)
  const condition = conditionLabel(coin.condition)

  const title = lang === 'zh' && coin.title_zh ? coin.title_zh
    : lang === 'en' ? coin.title_en
    : coin.title_th

  const description = lang === 'en' ? coin.description_en : coin.description_th

  const maxPrice = Math.max(...MOCK_PRICE_HISTORY.map(p => p.price))

  return (
    <div className="min-h-screen bg-[#FDF8EE]">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-yellow-700">หน้าแรก</Link>
          <ChevronRight size={14} />
          <Link href="/market" className="hover:text-yellow-700">{t.nav.market}</Link>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium truncate max-w-xs">{coin.title_th}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

          {/* ─── LEFT: Images ─── */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="relative aspect-square bg-gradient-to-br from-yellow-50 to-amber-50 rounded-3xl overflow-hidden border border-yellow-100 shadow-md">
              {coin.images?.[activeImg] ? (
                <Image
                  src={coin.images[activeImg]}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">🪙</div>
              )}
              {coin.is_authenticated && (
                <div className="absolute top-4 left-4 badge-auth flex items-center gap-1 text-sm px-3 py-1">
                  <ShieldCheck size={14} />
                  {t.coin.authenticated}
                </div>
              )}
              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-black/50 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                <Eye size={12} />
                {coin.view_count} {t.coin.views}
              </div>
            </div>

            {/* Thumbnail strip */}
            {coin.images.length > 1 && (
              <div className="flex gap-2">
                {coin.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? 'border-yellow-500' : 'border-transparent opacity-60 hover:opacity-90'}`}
                  >
                    <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}

            {/* Certificate card */}
            {coin.is_authenticated && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center shrink-0">
                    <ShieldCheck className="text-green-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-green-800 text-sm">{t.coin.certificate}</h4>
                    <p className="text-green-700 text-xs mt-0.5">รับรองโดย อ.สมชาย เซียนพระ</p>
                    <p className="text-green-600 text-xs">ตรวจสอบ: 15 พ.ค. 2568</p>
                  </div>
                  <button className="text-xs text-green-700 underline font-medium">ดูใบรับรอง</button>
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT: Info ─── */}
          <div className="space-y-6">
            {/* Title + badges */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge variant={coin.status === 'available' ? 'green' : coin.status === 'reserved' ? 'gold' : 'gray'}>
                  {t.coin[coin.status]}
                </Badge>
                {coin.is_authenticated && <Badge variant="green"><ShieldCheck size={10} /> {t.coin.authenticated}</Badge>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-1">{title}</h1>
              {lang !== 'th' && <p className="text-gray-500 text-sm">{coin.title_th}</p>}
            </div>

            {/* Price */}
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-5 border border-yellow-200">
              <div className="text-3xl font-black text-[#8B6914] mb-1">฿{price.thb}</div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>~${price.usd} USD</span>
                <span>·</span>
                <span>~¥{price.cny} CNY</span>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: <Star size={14} />,     label: t.coin.condition, value: `${condition.th} (${coin.condition}/5)` },
                { icon: <Calendar size={14} />, label: t.coin.year,      value: `พ.ศ. ${coin.year_th} / ${coin.year_ce}` },
                { icon: <MapPin size={14} />,   label: t.coin.temple,    value: lang === 'en' ? coin.temple_en : coin.temple_th },
                { icon: <Package size={14} />,  label: t.coin.material,  value: lang === 'en' ? coin.material_en : coin.material_th },
                ...(coin.size_mm ? [{ icon: <Ruler size={14} />,   label: t.coin.size,   value: `${coin.size_mm} mm` }] : []),
                ...(coin.weight_gram ? [{ icon: <Weight size={14} />, label: t.coin.weight, value: `${coin.weight_gram} g` }] : []),
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-gray-100">
                  <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <div className="font-semibold text-gray-800 text-sm">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Condition stars */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t.coin.condition}:</span>
              <StarRating score={coin.condition} />
              <span className="text-sm font-medium text-gray-700">{condition.en}</span>
            </div>

            {/* Description */}
            {description && (
              <div>
                <h3 className="font-bold text-gray-800 mb-2 text-sm">รายละเอียด</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-3">
              {coin.status === 'available' ? (
                <>
                  <Link href={`/checkout/${coin.id}`} className="block">
                    <Button variant="gold" size="lg" className="w-full text-base">
                      <ShoppingCart size={18} />
                      {t.coin.buy_now}
                    </Button>
                  </Link>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant={watchlisted ? 'dark' : 'outline'}
                      size="md"
                      onClick={() => setWatchlisted(!watchlisted)}
                      className="w-full"
                    >
                      <Heart size={16} className={watchlisted ? 'fill-current' : ''} />
                      {t.coin.add_watchlist}
                    </Button>
                    <Button variant="ghost" size="md" className="w-full border border-gray-200">
                      <MessageCircle size={16} />
                      {t.coin.ask_seller}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-gray-100 rounded-2xl p-4 text-center text-gray-500 font-medium">
                  {coin.status === 'sold' ? '❌ เหรียญนี้ขายแล้ว' : '⏳ เหรียญนี้ถูกจองแล้ว'}
                </div>
              )}
            </div>

            {/* Escrow note */}
            <div className="flex items-start gap-2 text-xs text-gray-500 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <Lock size={14} className="text-blue-500 shrink-0 mt-0.5" />
              <span>{t.order.escrow_note}</span>
            </div>

            {/* Seller info */}
            <div className="bg-white rounded-2xl border border-yellow-100 p-4">
              <h4 className="font-bold text-gray-800 text-sm mb-3">ผู้ขาย</h4>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center font-bold text-yellow-700 text-sm">
                  {MOCK_SELLER.name[0]}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800 text-sm flex items-center gap-1.5">
                    {MOCK_SELLER.name}
                    {MOCK_SELLER.verified_seller && (
                      <ShieldCheck size={14} className="text-green-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <StarRating score={5} size="sm" />
                    <span>{MOCK_SELLER.rating} · {MOCK_SELLER.total_sales} ขาย</span>
                  </div>
                </div>
                <button className="text-xs text-yellow-700 font-medium hover:underline">ดูร้าน</button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Price History Chart ─── */}
        <div className="mt-12 bg-white rounded-3xl border border-yellow-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="text-yellow-600" size={20} />
            <h3 className="font-black text-gray-900">{t.coin.price_history}</h3>
          </div>
          <div className="flex items-end gap-3 h-36">
            {MOCK_PRICE_HISTORY.map((item, i) => {
              const pct = (item.price / maxPrice) * 100
              const isLast = i === MOCK_PRICE_HISTORY.length - 1
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs font-bold text-gray-700">฿{(item.price / 1000).toFixed(1)}K</div>
                  <div
                    className={`w-full rounded-t-xl transition-all ${isLast ? 'gold-gradient' : 'bg-yellow-200'}`}
                    style={{ height: `${pct}%`, minHeight: '8px' }}
                  />
                  <div className="text-xs text-gray-400">{item.year}</div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">ราคา 2020: <span className="font-bold text-gray-700">฿800</span></span>
            <span className="text-green-600 font-bold flex items-center gap-1">
              <TrendingUp size={14} />
              +212% ใน 5 ปี
            </span>
            <span className="text-gray-500">ราคาปัจจุบัน: <span className="font-bold text-[#8B6914]">฿{price.thb}</span></span>
          </div>
        </div>

        {/* ─── Related coins ─── */}
        <div className="mt-12">
          <h3 className="font-black text-gray-900 text-xl mb-6">เหรียญที่คล้ายกัน</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {MOCK_COINS.filter(c => c.id !== coin.id).slice(0, 4).map(c => (
              <Link key={c.id} href={`/coins/${c.id}`}>
                <div className="bg-white rounded-2xl border border-yellow-100 overflow-hidden card-hover">
                  <div className="relative aspect-square bg-yellow-50">
                    {c.images?.[0] && <Image src={c.images[0]} alt={c.title_th} fill className="object-cover" sizes="200px" />}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-gray-800 line-clamp-2 mb-1">{c.title_th}</p>
                    <p className="text-sm font-black text-[#8B6914]">฿{c.price_thb.toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
