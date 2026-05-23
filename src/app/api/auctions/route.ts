import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, conflict, serverError } from '@/lib/api-response'
import { createAuctionSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { AuctionStatus, CoinStatus } from '@/lib/prisma-enums'

// GET /api/auctions — List auctions
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const status  = (searchParams.get('status') as AuctionStatus) ?? AuctionStatus.LIVE
    const page    = Number(searchParams.get('page') ?? 1)
    const limit   = Number(searchParams.get('limit') ?? 20)
    const skip    = (page - 1) * limit

    const where: Record<string, unknown> = { status }

    const [auctions, total] = await Promise.all([
      prisma.auction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startAt: 'asc' },
        include: {
          coin: {
            select: {
              id: true, titleTh: true, titleEn: true, images: true,
              monkNameTh: true, condition: true, isAuthenticated: true,
            },
          },
          bids: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            include: {
              bidder: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
          _count: { select: { bids: true } },
        },
      }),
      prisma.auction.count({ where }),
    ])

    return ok(auctions, { total, page, limit, hasMore: skip + auctions.length < total })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/auctions — Create auction
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = createAuctionSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { coinId, startAt, endAt, startPriceTHB, reservePriceTHB, buyNowPriceTHB, minIncrementTHB } = parsed.data

    // Validate coin ownership
    const coin = await prisma.coin.findUnique({ where: { id: coinId } })
    if (!coin)                              return badRequest('Coin not found')
    if (coin.sellerId !== user.id)          return badRequest('You do not own this coin')
    if (coin.status !== CoinStatus.AVAILABLE) return conflict('Coin is not available for auction')
    if (coin.isAuction)                     return conflict('Coin already in auction')

    // Validate dates
    const start = new Date(startAt)
    const end   = new Date(endAt)
    if (end <= start) return badRequest('End time must be after start time')
    if (start < new Date()) return badRequest('Start time must be in the future')

    const auction = await prisma.$transaction(async (tx: typeof prisma) => {
      const a = await tx.auction.create({
        data: {
          coinId,
          sellerId: user.id,
          startPriceTHB,
          reservePriceTHB,
          buyNowPriceTHB,
          minIncrementTHB,
          startAt: start,
          endAt:   end,
          status:  start > new Date() ? AuctionStatus.SCHEDULED : AuctionStatus.LIVE,
        },
      })
      await tx.coin.update({
        where: { id: coinId },
        data:  { isAuction: true, status: CoinStatus.RESERVED },
      })
      return a
    })

    return created(auction)
  } catch (e) {
    return serverError(e)
  }
}
