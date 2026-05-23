import { z } from 'zod'
import { CoinCondition, CoinStatus } from '@prisma/client'

// ─── Pagination ───
export const paginationSchema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

// ─── Coin ───
export const createCoinSchema = z.object({
  titleTh:       z.string().min(3).max(200),
  titleEn:       z.string().min(3).max(200),
  titleZh:       z.string().max(200).optional(),
  monkId:        z.string().uuid().optional(),
  monkNameTh:    z.string().min(2).max(100),
  monkNameEn:    z.string().min(2).max(100),
  templeTh:      z.string().min(2).max(200),
  templeEn:      z.string().min(2).max(200),
  province:      z.string().max(100).optional(),
  yearTh:        z.number().int().min(2000).max(2700),
  yearCe:        z.number().int().min(1500).max(2100),
  materialTh:    z.string().min(2).max(100),
  materialEn:    z.string().min(2).max(100),
  sizeMm:        z.number().positive().optional(),
  weightGram:    z.number().positive().optional(),
  condition:     z.nativeEnum(CoinCondition),
  priceTHB:      z.number().positive().max(100_000_000),
  images:        z.array(z.string().url()).min(1).max(10),
  descriptionTh: z.string().max(5000).optional(),
  descriptionEn: z.string().max(5000).optional(),
  descriptionZh: z.string().max(5000).optional(),
  isAuction:     z.boolean().default(false),
  tags:          z.array(z.string()).max(10).default([]),
})

export const updateCoinSchema = createCoinSchema.partial().extend({
  status: z.nativeEnum(CoinStatus).optional(),
})

export const coinFilterSchema = z.object({
  ...paginationSchema.shape,
  q:         z.string().optional(),
  monk:      z.string().optional(),
  province:  z.string().optional(),
  condition: z.nativeEnum(CoinCondition).optional(),
  status:    z.nativeEnum(CoinStatus).optional(),
  minPrice:  z.coerce.number().optional(),
  maxPrice:  z.coerce.number().optional(),
  minYear:   z.coerce.number().optional(),
  maxYear:   z.coerce.number().optional(),
  certified: z.coerce.boolean().optional(),
  isAuction: z.coerce.boolean().optional(),
  sellerId:  z.string().uuid().optional(),
  sort:      z.enum(['newest', 'oldest', 'price_asc', 'price_desc', 'popular']).default('newest'),
})

// ─── Order ───
export const createOrderSchema = z.object({
  coinId: z.string().uuid(),
  shippingAddress: z.object({
    name:       z.string().min(2),
    address:    z.string().min(5),
    city:       z.string().min(2),
    country:    z.string().min(2),
    postalCode: z.string().min(3),
    phone:      z.string().min(8),
  }),
  notes: z.string().max(500).optional(),
})

export const updateOrderSchema = z.object({
  status:          z.enum(['SHIPPED', 'DELIVERED', 'CANCELLED', 'DISPUTED']).optional(),
  trackingNumber:  z.string().max(100).optional(),
  shippingCarrier: z.string().max(50).optional(),
  notes:           z.string().max(500).optional(),
  disputeReason:   z.string().max(1000).optional(),
})

// ─── Certificate ───
export const createCertSchema = z.object({
  coinId:      z.string().uuid(),
  notesTh:     z.string().max(2000).optional(),
  notesEn:     z.string().max(2000).optional(),
  certImageUrl:z.string().url().optional(),
  expiresAt:   z.string().datetime().optional(),
})

export const updateCertSchema = z.object({
  status:          z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().max(500).optional(),
})

// ─── Review ───
export const createReviewSchema = z.object({
  orderId:   z.string().uuid(),
  rating:    z.number().int().min(1).max(5),
  titleTh:   z.string().max(200).optional(),
  commentTh: z.string().max(2000).optional(),
  commentEn: z.string().max(2000).optional(),
  images:    z.array(z.string().url()).max(5).default([]),
})

// ─── Auction ───
export const createAuctionSchema = z.object({
  coinId:           z.string().uuid(),
  startPriceTHB:    z.number().positive(),
  reservePriceTHB:  z.number().positive().optional(),
  buyNowPriceTHB:   z.number().positive().optional(),
  minIncrementTHB:  z.number().positive().default(100),
  startAt:          z.string().datetime(),
  endAt:            z.string().datetime(),
})

export const placeBidSchema = z.object({
  auctionId:  z.string().uuid(),
  amountTHB:  z.number().positive(),
  isAutoBid:  z.boolean().default(false),
  maxBidTHB:  z.number().positive().optional(),
})

// ─── User ───
export const updateUserSchema = z.object({
  name:      z.string().min(2).max(100).optional(),
  nameEn:    z.string().max(100).optional(),
  bio:       z.string().max(500).optional(),
  phone:     z.string().max(20).optional(),
  lineId:    z.string().max(50).optional(),
  wechatId:  z.string().max(50).optional(),
  country:   z.string().length(2).optional(),
  avatarUrl: z.string().url().optional(),
})

// ─── AI Analysis ───
export const createAiAnalysisSchema = z.object({
  imageUrl: z.string().url(),
  coinId:   z.string().uuid().optional(),
})
