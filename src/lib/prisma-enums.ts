// ============================================================
// Prisma Enum stubs — ใช้ตอน Prisma generate ยังไม่ได้รัน
// จะถูก replace โดย @prisma/client หลัง npx prisma generate
// ============================================================

export const Role = {
  BUYER:  'BUYER',
  SELLER: 'SELLER',
  EXPERT: 'EXPERT',
  ADMIN:  'ADMIN',
} as const

export const CoinStatus = {
  DRAFT:          'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  AVAILABLE:      'AVAILABLE',
  RESERVED:       'RESERVED',
  SOLD:           'SOLD',
  DELISTED:       'DELISTED',
} as const

export const CoinCondition = {
  WORN:      'WORN',
  FAIR:      'FAIR',
  GOOD:      'GOOD',
  VERY_GOOD: 'VERY_GOOD',
  MINT:      'MINT',
} as const

export const OrderStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  PAID:            'PAID',
  PROCESSING:      'PROCESSING',
  SHIPPED:         'SHIPPED',
  DELIVERED:       'DELIVERED',
  COMPLETED:       'COMPLETED',
  CANCELLED:       'CANCELLED',
  REFUNDED:        'REFUNDED',
  DISPUTED:        'DISPUTED',
} as const

export const PaymentStatus = {
  PENDING:      'PENDING',
  ESCROW_HELD:  'ESCROW_HELD',
  RELEASED:     'RELEASED',
  REFUNDED:     'REFUNDED',
  FAILED:       'FAILED',
} as const

export const AuctionStatus = {
  SCHEDULED: 'SCHEDULED',
  LIVE:      'LIVE',
  ENDED:     'ENDED',
  CANCELLED: 'CANCELLED',
} as const

export const CertStatus = {
  PENDING:  'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

export const FraudSeverity = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
} as const

export const AiStatus = {
  PROCESSING: 'PROCESSING',
  COMPLETED:  'COMPLETED',
  FAILED:     'FAILED',
} as const

export const NotifType = {
  ORDER_UPDATE:   'ORDER_UPDATE',
  AUCTION_BID:    'AUCTION_BID',
  AUCTION_WIN:    'AUCTION_WIN',
  AUCTION_OUTBID: 'AUCTION_OUTBID',
  CERT_UPDATE:    'CERT_UPDATE',
  SYSTEM:         'SYSTEM',
  FRAUD_ALERT:    'FRAUD_ALERT',
} as const

// Type exports (match Prisma generated types)
export type Role          = typeof Role[keyof typeof Role]
export type CoinStatus    = typeof CoinStatus[keyof typeof CoinStatus]
export type CoinCondition = typeof CoinCondition[keyof typeof CoinCondition]
export type OrderStatus   = typeof OrderStatus[keyof typeof OrderStatus]
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus]
export type AuctionStatus = typeof AuctionStatus[keyof typeof AuctionStatus]
export type CertStatus    = typeof CertStatus[keyof typeof CertStatus]
export type FraudSeverity = typeof FraudSeverity[keyof typeof FraudSeverity]
export type AiStatus      = typeof AiStatus[keyof typeof AiStatus]
export type NotifType     = typeof NotifType[keyof typeof NotifType]

// User type stub
export interface User {
  id:              string
  supabaseId:      string
  email:           string
  name:            string
  role:            Role
  isVerifiedSeller: boolean
  isVerifiedExpert: boolean
  isBanned:        boolean
  rating:          number
  totalSales:      number
  totalPurchases:  number
  createdAt:       Date
  updatedAt:       Date
  [key: string]:   unknown
}
