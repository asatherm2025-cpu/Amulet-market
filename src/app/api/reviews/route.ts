import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, created, badRequest, unauthorized, conflict, serverError } from '@/lib/api-response'
import { createReviewSchema } from '@/lib/validations'
import { getCurrentUser } from '@/lib/auth-helpers'
import { OrderStatus } from '@prisma/client'

// GET /api/reviews?sellerId=xxx — Seller reviews
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const sellerId = searchParams.get('sellerId')
    const page     = Number(searchParams.get('page') ?? 1)
    const limit    = Number(searchParams.get('limit') ?? 20)
    const skip     = (page - 1) * limit

    const where = { ...(sellerId && { sellerId }) }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reviewer: { select: { id: true, name: true, avatarUrl: true, country: true } },
        },
      }),
      prisma.review.count({ where }),
    ])

    // Rating summary
    const summary = sellerId ? await prisma.review.aggregate({
      where:   { sellerId },
      _avg:    { rating: true },
      _count:  { rating: true },
    }) : null

    return ok({ reviews, summary }, { total, page, limit, hasMore: skip + reviews.length < total })
  } catch (e) {
    return serverError(e)
  }
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return unauthorized()

    const body   = await req.json()
    const parsed = createReviewSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.message)

    const { orderId, rating, titleTh, commentTh, commentEn, images } = parsed.data

    // Validate order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { review: true },
    })
    if (!order) return badRequest('Order not found')
    if (order.buyerId !== user.id) return badRequest('Not your order')
    if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.COMPLETED) {
      return badRequest('Order must be delivered before reviewing')
    }
    if (order.review) return conflict('Review already exists for this order')

    const review = await prisma.$transaction(async (tx) => {
      const r = await tx.review.create({
        data: {
          orderId,
          reviewerId: user.id,
          sellerId:   order.sellerId,
          rating,
          titleTh,
          commentTh,
          commentEn,
          images,
        },
      })

      // Update seller rating
      const avg = await tx.review.aggregate({
        where:  { sellerId: order.sellerId },
        _avg:   { rating: true },
        _count: { rating: true },
      })

      await tx.user.update({
        where: { id: order.sellerId },
        data:  { rating: avg._avg.rating ?? 0 },
      })

      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data:  { status: OrderStatus.COMPLETED, completedAt: new Date() },
      })

      // Notify seller
      await tx.notification.create({
        data: {
          userId:  order.sellerId,
          type:    'ORDER_UPDATE',
          title:   'มีรีวิวใหม่!',
          message: `${user.name} ให้คะแนน ${rating}/5 ดาว`,
          data:    { reviewId: r.id },
        },
      })

      return r
    })

    return created(review)
  } catch (e) {
    return serverError(e)
  }
}
