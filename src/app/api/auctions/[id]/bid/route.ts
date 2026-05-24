import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, conflict, serverError } from '@/lib/api-response'
import { placeBidSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { AuctionStatus } from '@/lib/prisma-enums'

// POST /api/auctions/[id]/bid — Place a bid
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { id: auctionId } = await params
    const body   = await req.json()
    const parsed = placeBidSchema.safeParse({ ...body, auctionId })
    if (!parsed.success) return badRequest(parsed.error.message)

    const { amountTHB, isAutoBid, maxBidTHB } = parsed.data

    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { amountTHB: 'desc' },
          take: 1,
          include: { bidder: { select: { id: true } } },
        },
      },
    })

    if (!auction) return badRequest('Auction not found')
    if (auction.status !== AuctionStatus.LIVE) return conflict('Auction is not live')
    if (auction.sellerId === user.id) return badRequest('Cannot bid on your own auction')
    if (new Date() > auction.endAt) return conflict('Auction has ended')

    // Validate bid amount
    const currentBid  = Number(auction.currentBidTHB ?? auction.startPriceTHB)
    const minRequired = currentBid + Number(auction.minIncrementTHB)
    if (amountTHB < minRequired) {
      return badRequest(`Minimum bid is ฿${minRequired.toLocaleString()}`)
    }

    // Check if buy now price reached
    const buyNow = auction.buyNowPriceTHB ? Number(auction.buyNowPriceTHB) : null
    const isBuyNow = buyNow !== null && amountTHB >= buyNow

    // Previous highest bidder
    const prevHighest = auction.bids[0]

    const bid = await prisma.$transaction(async (tx: typeof prisma) => {
      // Unmark previous winning bid
      if (prevHighest) {
        await tx.bid.update({
          where: { id: prevHighest.id },
          data:  { isWinning: false },
        })
        // Notify outbid
        if (prevHighest.bidder.id !== user.id) {
          await tx.notification.create({
            data: {
              userId:  prevHighest.bidder.id,
              type:    'AUCTION_OUTBID',
              title:   'คุณถูก Outbid แล้ว!',
              message: `มีผู้ประมูลด้วยราคา ฿${amountTHB.toLocaleString()}`,
              data:    { auctionId },
            },
          })
        }
      }

      // Create new bid
      const newBid = await tx.bid.create({
        data: {
          auctionId,
          bidderId: user.id,
          amountTHB,
          isWinning: true,
          isAutoBid,
          maxBidTHB,
        },
      })

      // Update auction current bid
      await tx.auction.update({
        where: { id: auctionId },
        data: {
          currentBidTHB: amountTHB,
          bidCount: { increment: 1 },
          ...(isBuyNow && {
            status:       AuctionStatus.ENDED,
            winnerId:     user.id,
            winningBidTHB: amountTHB,
          }),
        },
      })

      return newBid
    })

    return created({ bid, isBuyNow })
  } catch (e) {
    return serverError(e)
  }
}

// GET /api/auctions/[id]/bid — Get auction bids
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const page  = Number(req.nextUrl.searchParams.get('page') ?? 1)
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 20)
    const skip  = (page - 1) * limit

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where:   { auctionId },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          bidder: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.bid.count({ where: { auctionId } }),
    ])

    return ok(bids, { total, page, limit, hasMore: skip + bids.length < total })
  } catch (e) {
    return serverError(e)
  }
}
