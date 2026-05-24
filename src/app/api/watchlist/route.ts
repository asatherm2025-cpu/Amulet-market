import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, serverError } from '@/lib/api-response'
import { getCurrentUser } from '@/lib/auth-helpers'

// GET /api/watchlist — My watchlist
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const page  = Number(req.nextUrl.searchParams.get('page') ?? 1)
    const limit = Number(req.nextUrl.searchParams.get('limit') ?? 20)
    const skip  = (page - 1) * limit

    const [items, total] = await Promise.all([
      prisma.watchlist.findMany({
        where:   { userId: user.id },
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          coin: {
            select: {
              id: true, titleTh: true, titleEn: true, images: true,
              priceTHB: true, status: true, condition: true,
              isAuthenticated: true,
              seller: { select: { id: true, name: true, rating: true } },
            },
          },
        },
      }),
      prisma.watchlist.count({ where: { userId: user.id } }),
    ])

    return ok(items, { total, page, limit, hasMore: skip + items.length < total })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/watchlist — Toggle watchlist
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const { coinId } = await req.json()
    if (!coinId) return badRequest('coinId is required')

    const existing = await prisma.watchlist.findUnique({
      where: { userId_coinId: { userId: user.id, coinId } },
    })

    if (existing) {
      // Remove from watchlist
      await prisma.$transaction([
        prisma.watchlist.delete({ where: { id: existing.id } }),
        prisma.coin.update({
          where: { id: coinId },
          data:  { watchlistCount: { decrement: 1 } },
        }),
      ])
      return ok({ added: false, coinId })
    } else {
      // Add to watchlist
      await prisma.$transaction([
        prisma.watchlist.create({ data: { userId: user.id, coinId } }),
        prisma.coin.update({
          where: { id: coinId },
          data:  { watchlistCount: { increment: 1 } },
        }),
      ])
      return created({ added: true, coinId })
    }
  } catch (e) {
    return serverError(e)
  }
}
