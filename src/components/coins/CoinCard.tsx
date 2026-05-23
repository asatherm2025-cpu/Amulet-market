'use client'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, Eye, ShieldCheck } from 'lucide-react'
import { Coin } from '@/lib/types'
import { formatPrice, conditionLabel } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { StarRating } from '@/components/ui/StarRating'
import { useLang } from '@/context/LangContext'

interface CoinCardProps {
  coin: Coin
  onWatchlist?: (id: string) => void
  isWatchlisted?: boolean
}

export default function CoinCard({ coin, onWatchlist, isWatchlisted }: CoinCardProps) {
  const { t, lang } = useLang()
  const price = formatPrice(coin.price_thb)
  const condition = conditionLabel(coin.condition)

  const title = lang === 'zh' && coin.title_zh ? coin.title_zh
    : lang === 'en' ? coin.title_en
    : coin.title_th

  const statusConfig = {
    available: { label: t.coin.available, variant: 'green' as const },
    reserved:  { label: t.coin.reserved,  variant: 'gold'  as const },
    sold:      { label: t.coin.sold,      variant: 'gray'  as const },
  }
  const status = statusConfig[coin.status]

  return (
    <div className="bg-white rounded-2xl border border-yellow-100 shadow-sm overflow-hidden card-hover group">
      {/* Image */}
      <div className="relative aspect-square bg-gradient-to-br from-yellow-50 to-amber-50 overflow-hidden">
        {coin.images?.[0] ? (
          <Image
            src={coin.images[0]}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">🪙</div>
        )}

        {/* Overlay badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {coin.is_authenticated && (
            <span className="badge-auth flex items-center gap-1">
              <ShieldCheck size={10} />
              {t.coin.authenticated}
            </span>
          )}
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        {/* Watchlist button */}
        <button
          onClick={(e) => { e.preventDefault(); onWatchlist?.(coin.id) }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white shadow transition-all"
        >
          <Heart
            size={15}
            className={isWatchlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          />
        </button>

        {/* View count */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 text-white text-xs px-1.5 py-0.5 rounded-full backdrop-blur-sm">
          <Eye size={10} />
          {coin.view_count}
        </div>
      </div>

      {/* Content */}
      <Link href={`/coins/${coin.id}`} className="block p-3">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug mb-1.5">
          {title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>{lang === 'en' ? coin.temple_en : coin.temple_th}</span>
          <span>•</span>
          <span>{lang === 'en' ? `${coin.year_ce}` : `ปี ${coin.year_th}`}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-black text-[#8B6914]">
              ฿{price.thb}
            </div>
            <div className="text-xs text-gray-400">
              ~${price.usd}
              <span className="mx-1">·</span>
              ¥{price.cny}
            </div>
          </div>
          <div className="text-right">
            <StarRating score={coin.condition} size="sm" />
            <div className="text-xs text-gray-400 mt-0.5">{condition.en}</div>
          </div>
        </div>
      </Link>
    </div>
  )
}
