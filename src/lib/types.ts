// ============================================================
// SIAM COIN — Shared Types (Frontend)
// ============================================================

export type Language = 'th' | 'en' | 'zh'

// Re-export Prisma enums for client use
export type CoinStatus    = 'DRAFT' | 'PENDING_REVIEW' | 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'DELISTED'
export type CoinCondition = 'WORN' | 'FAIR' | 'GOOD' | 'VERY_GOOD' | 'MINT'
export type OrderStatus   = 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED' | 'DISPUTED'
export type UserRole      = 'BUYER' | 'SELLER' | 'EXPERT' | 'ADMIN'
export type AuctionStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED'
export type NotifType     = 'ORDER_UPDATE' | 'AUCTION_BID' | 'AUCTION_WIN' | 'AUCTION_OUTBID' | 'CERT_UPDATE' | 'SYSTEM' | 'FRAUD_ALERT'

// Condition labels
export const CONDITION_LABELS: Record<CoinCondition, { th: string; en: string; score: number }> = {
  WORN:      { th: 'สภาพคงเดิม',  en: 'Worn',      score: 1 },
  FAIR:      { th: 'สภาพพอใช้',   en: 'Fair',      score: 2 },
  GOOD:      { th: 'สภาพดี',      en: 'Good',      score: 3 },
  VERY_GOOD: { th: 'สภาพดีมาก',  en: 'Very Good', score: 4 },
  MINT:      { th: 'สภาพสวยใหม่', en: 'Mint',      score: 5 },
}

// Status display
export const STATUS_LABELS: Record<CoinStatus, { th: string; color: string }> = {
  DRAFT:          { th: 'แบบร่าง',         color: 'gray'   },
  PENDING_REVIEW: { th: 'รอตรวจสอบ',       color: 'yellow' },
  AVAILABLE:      { th: 'มีของ',            color: 'green'  },
  RESERVED:       { th: 'จองแล้ว',          color: 'blue'   },
  SOLD:           { th: 'ขายแล้ว',          color: 'gray'   },
  DELISTED:       { th: 'ถูกนำออก',         color: 'red'    },
}

// Price formatter
export function formatTHB(amount: number): string {
  return new Intl.NumberFormat('th-TH').format(amount)
}

export function formatUSD(thb: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(thb / 37)
}

export function formatCNY(thb: number): string {
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(thb / 5.1)
}

export function formatPrice(thb: number) {
  return {
    thb: formatTHB(thb),
    usd: formatUSD(thb),
    cny: formatCNY(thb),
  }
}

// Coin API response type (from Prisma include)
export interface CoinListItem {
  id:              string
  titleTh:         string
  titleEn:         string
  titleZh?:        string
  monkNameTh:      string
  monkNameEn:      string
  templeTh:        string
  templeEn:        string
  yearTh:          number
  yearCe:          number
  materialTh:      string
  materialEn:      string
  condition:       CoinCondition
  priceTHB:        number
  images:          string[]
  isAuthenticated: boolean
  status:          CoinStatus
  viewCount:       number
  isAuction:       boolean
  seller: {
    id:              string
    name:            string
    avatarUrl?:      string
    rating:          number
    isVerifiedSeller: boolean
  }
  certificate?: { status: string } | null
  _count:       { watchlistItems: number }
  createdAt:    string
}

export interface OrderListItem {
  id:           string
  orderNumber:  string
  amountTHB:    number
  totalTHB:     number
  status:       OrderStatus
  createdAt:    string
  coin: {
    id:      string
    titleTh: string
    images:  string[]
    priceTHB: number
  }
  buyer:  { id: string; name: string; avatarUrl?: string }
  seller: { id: string; name: string; avatarUrl?: string }
}

export interface AuctionItem {
  id:             string
  startPriceTHB:  number
  currentBidTHB?: number
  buyNowPriceTHB?: number
  minIncrementTHB: number
  status:         AuctionStatus
  startAt:        string
  endAt:          string
  bidCount:       number
  coin: {
    id:             string
    titleTh:        string
    titleEn:        string
    images:         string[]
    monkNameTh:     string
    condition:      CoinCondition
    isAuthenticated: boolean
  }
}


// ── Legacy Coin type (for mock-data compatibility) ──────────
export interface Coin {
  id:              string
  title_th:        string
  title_en:        string
  title_zh?:       string
  monk_name_th:    string
  monk_name_en:    string
  temple_th:       string
  temple_en:       string
  province?:       string
  year_th:         number
  year_ce:         number
  material_th:     string
  material_en:     string
  size_mm?:        number
  weight_gram?:    number
  condition:       1 | 2 | 3 | 4 | 5
  price_thb:       number
  images:          string[]
  is_authenticated: boolean
  status:          'available' | 'reserved' | 'sold'
  seller_id:       string
  description_th?: string
  description_en?: string
  view_count:      number
  created_at:      string
  seller?:         { id: string; name: string; avatarUrl?: string; rating: number; isVerifiedSeller: boolean }
  certificate?:    { status: string } | null
  _count?:         { watchlistItems: number }
}

export interface Order {
  id:              string
  buyer_id:        string
  coin_id:         string
  seller_id:       string
  amount_thb:      number
  shipping_fee_thb: number
  escrow_fee_thb:  number
  total_thb:       number
  payment_status:  string
  shipping_status: string
  tracking_number?: string
  shipping_address: Record<string, string>
  coin?:           Coin
  created_at:      string
}
